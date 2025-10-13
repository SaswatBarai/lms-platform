import argon from "argon2";
import { AppError } from "./AppError.js";
import env from "../config/env.js"
/**
 * Hashes a plain-text password using Argon2.
 * @param {string} password The password to hash.
 * @returns {Promise<string>} A promise that resolves with the hashed password.
 */
export const hashPassword = async (password:string):Promise<string> => {
    try {

        if(!password){
            throw new AppError("Password must be provided for hashing.",400);
        }

        const hash = await argon.hash(password,{
            type:argon.argon2id, //means it will provide both security and performance
        })
        return hash;
        
    } catch (error) {
        throw new AppError("Could not hash the password.",500);
        if(env.NODE_ENV === "development"){
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

export const verifyPassword = async (hash:string,password:string):Promise<boolean> => {
    try {
        if(!hash || !password){
            throw new AppError("Invalid hash or password provided for verification.",400);
        }
        const isValid = await argon.verify(hash,password);
        return isValid;
    } catch (error) {
        throw new AppError("Could not verify the password.",500);
        if(env.NODE_ENV === "development"){
            console.error("Error verifying password:", error);
        }
        
    }
}