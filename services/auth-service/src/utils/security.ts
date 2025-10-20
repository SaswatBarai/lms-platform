import argon from "argon2";
import { AppError } from "./AppError.js";
import env from "../config/env.js"
import { V4 as paseto } from "paseto"
import fs from "fs/promises";
import { OrganizationRole, TokenPlayload } from "../types/organization.js";


/**
 * Hashes a plain-text password using Argon2.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} A promise that resolves with the hashed password.
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {

        if (!password) {
            throw new AppError("Password must be provided for hashing.", 400);
        }

        const hash = await argon.hash(password, {
            type: argon.argon2id, //means it will provide both security and performance
        })
        return hash;

    } catch (error) {
        throw new AppError("Could not hash the password.", 500);
        if (env.NODE_ENV === "development") {
            console.error("Error hashing password:", error);
        }
    }
}


/**
 * Verifies a plain-text password against a hash.
 * @param {string} hash The stored hash from the database.
 * @param {string} password The plain-text password from user input.
 * @returns {Promise<boolean>} A promise that resolves to true if the password is correct, false otherwise.
 */

export const verifyPassword = async (hash: string, password: string): Promise<boolean> => {
    try {
        if (!hash || !password) {
            throw new AppError("Invalid hash or password provided for verification.", 400);
        }
        const isValid = await argon.verify(hash, password);
        return isValid;
    } catch (error) {
        throw new AppError("Could not verify the password.", 500);
        if (env.NODE_ENV === "development") {
            console.error("Error verifying password:", error);
        }

    }
}


export const validateEmail = (email:string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

//================= PASETO TOKEN UTILITIES ==================//



export const generateToken = async (userId: string, role: OrganizationRole, OnlyAccess = false): Promise<TokenPlayload> => {
    try {
        const privateKeyPem = await fs.readFile('private.key', 'utf-8');
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        if (OnlyAccess) {
            accessToken = await paseto.sign(
                {
                    userId,
                    role,
                },
                privateKeyPem,
                {
                    expiresIn: '15m',
                }
            );

            if (!accessToken) {
                throw new AppError("Could not generate access token.", 500);
            }
            return { accessToken };
        }

        // Generate both access and refresh tokens
        accessToken = await paseto.sign(
            {
                userId,
                role,
            },
            privateKeyPem,
            {
                expiresIn: '15m',
            }
        );

        refreshToken = await paseto.sign(
            {
                userId,
                role,
                type: 'refresh'
            },
            privateKeyPem,
            {
                expiresIn: '7d',
            }
        );

        if (!accessToken || !refreshToken) {
            throw new AppError("Could not generate tokens.", 500);
        }

        return { accessToken, refreshToken };

    } catch (error) {
        throw new AppError("Could not generate tokens.", 500);
        if (env.NODE_ENV === "development") {
            console.error("Error generating tokens:", error);
        }
    }
}