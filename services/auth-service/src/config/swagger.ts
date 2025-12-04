import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Application } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SWAGGER_PATH = process.env.SWAGGER_PATH || path.join(__dirname, '../../docs/swagger');

export const setupSwagger = (app: Application) => {
  try {
    console.log(`🔍 Setting up Swagger from path: ${SWAGGER_PATH}`);
    const swaggerDocument = YAML.load(path.join(SWAGGER_PATH, 'openapi.yaml'));
    console.log('✅ Swagger document loaded successfully');

    // Shadcn-inspired theme with dark/light mode support
    const themeWithToggle = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      :root {
        /* Light mode */
        --background: #ffffff;
        --foreground: #09090b;
        --card: #ffffff;
        --card-foreground: #09090b;
        --popover: #ffffff;
        --popover-foreground: #09090b;
        --primary: #09090b;
        --primary-foreground: #fafafa;
        --secondary: #f4f4f5;
        --secondary-foreground: #09090b;
        --muted: #f4f4f5;
        --muted-foreground: #71717a;
        --accent: #f4f4f5;
        --accent-foreground: #09090b;
        --destructive: #ef4444;
        --destructive-foreground: #fafafa;
        --border: #e4e4e7;
        --input: #e4e4e7;
        --ring: #09090b;
        --radius: 0.5rem;
      }

      [data-theme="dark"] {
        /* Dark mode - improved contrast */
        --background: #0a0a0a;
        --foreground: #f5f5f5;
        --card: #141414;
        --card-foreground: #f5f5f5;
        --popover: #141414;
        --popover-foreground: #f5f5f5;
        --primary: #f5f5f5;
        --primary-foreground: #0a0a0a;
        --secondary: #262626;
        --secondary-foreground: #f5f5f5;
        --muted: #1a1a1a;
        --muted-foreground: #d4d4d4;
        --accent: #262626;
        --accent-foreground: #f5f5f5;
        --destructive: #ef4444;
        --destructive-foreground: #f5f5f5;
        --border: #333333;
        --input: #333333;
        --ring: #f5f5f5;
      }

      * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        box-sizing: border-box;
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }

      body {
        background: var(--background) !important;
        color: var(--foreground) !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      /* Theme toggle button */
      #theme-toggle-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      }

      [data-theme="dark"] #theme-toggle-btn {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      }

      #theme-toggle-btn:hover {
        background: var(--muted);
        transform: scale(1.05);
      }

      #theme-toggle-btn svg {
        width: 20px;
        height: 20px;
        stroke: var(--foreground);
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #theme-toggle-btn .sun-icon {
        display: none;
      }

      #theme-toggle-btn .moon-icon {
        display: block;
      }

      [data-theme="dark"] #theme-toggle-btn .sun-icon {
        display: block;
      }

      [data-theme="dark"] #theme-toggle-btn .moon-icon {
        display: none;
      }

      /* Hide top bar */
      .swagger-ui .topbar { 
        display: none !important; 
      }

      /* Main wrapper */
      .swagger-ui {
        background: var(--background) !important;
        color: var(--foreground) !important;
      }

      .swagger-ui .wrapper {
        max-width: 1200px !important;
        margin: 0 auto !important;
        padding: 2rem !important;
      }

      /* Info section */
      .swagger-ui .info {
        margin: 0 0 3rem 0 !important;
        padding-bottom: 2rem !important;
        border-bottom: 1px solid var(--border) !important;
      }

      .swagger-ui .info .title {
        font-size: 2rem !important;
        font-weight: 700 !important;
        color: var(--foreground) !important;
        margin: 0 0 0.5rem 0 !important;
        letter-spacing: -0.02em !important;
      }

      .swagger-ui .info .description {
        color: var(--muted-foreground) !important;
        font-size: 0.875rem !important;
        line-height: 1.6 !important;
        margin-top: 0.75rem !important;
      }

      .swagger-ui .info .description p {
        color: var(--muted-foreground) !important;
        margin: 0.5rem 0 !important;
      }

      .swagger-ui .info .description li {
        color: var(--muted-foreground) !important;
      }

      .swagger-ui .info .base-url {
        color: var(--muted-foreground) !important;
      }

      .swagger-ui .info li,
      .swagger-ui .info p,
      .swagger-ui .info table,
      .swagger-ui .info h1,
      .swagger-ui .info h2,
      .swagger-ui .info h3,
      .swagger-ui .info h4,
      .swagger-ui .info h5 {
        color: var(--foreground) !important;
      }

      /* Ensure all text is readable */
      .swagger-ui,
      .swagger-ui p,
      .swagger-ui span,
      .swagger-ui div,
      .swagger-ui label {
        color: var(--foreground) !important;
      }

      .swagger-ui .renderedMarkdown p {
        color: var(--muted-foreground) !important;
      }

      /* Scheme container */
      .swagger-ui .scheme-container {
        background: var(--card) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius) !important;
        padding: 1rem !important;
        margin: 1.5rem 0 !important;
      }

      .swagger-ui .schemes select {
        background: var(--background) !important;
        color: var(--foreground) !important;
        border: 1px solid var(--input) !important;
        border-radius: calc(var(--radius) - 2px) !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
      }

      .swagger-ui .schemes select:focus {
        outline: none !important;
        border-color: var(--ring) !important;
        box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.05) !important;
      }

      [data-theme="dark"] .swagger-ui .schemes select:focus {
        box-shadow: 0 0 0 2px rgba(250, 250, 250, 0.1) !important;
      }

      /* Authorize button */
      .swagger-ui .btn.authorize {
        background: #18181b !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: var(--radius) !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
      }

      .swagger-ui .btn.authorize:hover {
        background: #27272a !important;
      }

      .swagger-ui .btn.authorize svg {
        fill: #ffffff !important;
      }

      .swagger-ui .btn.authorize span {
        color: #ffffff !important;
      }

      [data-theme="dark"] .swagger-ui .btn.authorize {
        background: #f5f5f5 !important;
        color: #0a0a0a !important;
      }

      [data-theme="dark"] .swagger-ui .btn.authorize:hover {
        background: #e5e5e5 !important;
      }

      [data-theme="dark"] .swagger-ui .btn.authorize svg {
        fill: #0a0a0a !important;
      }

      [data-theme="dark"] .swagger-ui .btn.authorize span {
        color: #0a0a0a !important;
      }

      /* Tags / Sections */
      .swagger-ui .opblock-tag {
        color: var(--foreground) !important;
        font-size: 1rem !important;
        font-weight: 600 !important;
        border-bottom: 1px solid var(--border) !important;
        padding: 1rem 0 !important;
        margin: 0 !important;
        background: transparent !important;
      }

      .swagger-ui .opblock-tag:hover {
        background: transparent !important;
      }

      .swagger-ui .opblock-tag small {
        color: var(--muted-foreground) !important;
        font-size: 0.75rem !important;
        font-weight: 400 !important;
        margin-left: 0.5rem !important;
      }

      /* Operation blocks */
      .swagger-ui .opblock {
        border-radius: var(--radius) !important;
        border: 1px solid var(--border) !important;
        margin: 0.75rem 0 !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        overflow: hidden !important;
        background: var(--card) !important;
      }

      [data-theme="dark"] .swagger-ui .opblock {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3) !important;
      }

      .swagger-ui .opblock .opblock-summary {
        border: none !important;
        padding: 0.875rem 1rem !important;
        background: transparent !important;
      }

      .swagger-ui .opblock .opblock-summary:hover {
        background: var(--muted) !important;
      }

      .swagger-ui .opblock .opblock-summary-path {
        color: var(--foreground) !important;
        font-family: 'Inter', monospace !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
      }

      .swagger-ui .opblock .opblock-summary-description {
        color: var(--muted-foreground) !important;
        font-size: 0.8125rem !important;
        margin-top: 0.25rem !important;
      }

      /* Method badges */
      .swagger-ui .opblock .opblock-summary-method {
        border-radius: calc(var(--radius) - 2px) !important;
        font-weight: 600 !important;
        font-size: 0.75rem !important;
        padding: 0.25rem 0.625rem !important;
        min-width: 60px !important;
        text-align: center !important;
        text-transform: uppercase !important;
        letter-spacing: 0.025em !important;
      }

      .swagger-ui .opblock.opblock-get .opblock-summary-method {
        background: #3b82f6 !important;
        color: white !important;
      }

      .swagger-ui .opblock.opblock-post .opblock-summary-method {
        background: #10b981 !important;
        color: white !important;
      }

      .swagger-ui .opblock.opblock-put .opblock-summary-method {
        background: #f59e0b !important;
        color: white !important;
      }

      .swagger-ui .opblock.opblock-delete .opblock-summary-method {
        background: var(--destructive) !important;
        color: white !important;
      }

      .swagger-ui .opblock.opblock-patch .opblock-summary-method {
        background: #8b5cf6 !important;
        color: white !important;
      }

      /* Operation body */
      .swagger-ui .opblock-body {
        background: var(--card) !important;
        border-top: 1px solid var(--border) !important;
      }

      .swagger-ui .opblock-body pre {
        background: var(--muted) !important;
        border-radius: var(--radius) !important;
        border: 1px solid var(--border) !important;
        margin: 1rem !important;
      }

      .swagger-ui .opblock-body pre.microlight {
        color: var(--foreground) !important;
        font-family: 'Inter', monospace !important;
        font-size: 0.8125rem !important;
        padding: 1rem !important;
        line-height: 1.6 !important;
      }

      /* Parameters */
      .swagger-ui .opblock-section-header {
        background: var(--muted) !important;
        border-radius: var(--radius) var(--radius) 0 0 !important;
        padding: 0.75rem 1rem !important;
        border-bottom: 1px solid var(--border) !important;
      }

      .swagger-ui .opblock-section-header h4 {
        color: var(--foreground) !important;
        font-weight: 600 !important;
        font-size: 0.875rem !important;
        margin: 0 !important;
      }

      .swagger-ui .parameters-col_description {
        color: var(--muted-foreground) !important;
        font-size: 0.8125rem !important;
      }

      .swagger-ui .parameter__name {
        color: var(--foreground) !important;
        font-family: 'Inter', monospace !important;
        font-weight: 500 !important;
        font-size: 0.8125rem !important;
      }

      .swagger-ui .parameter__type {
        color: var(--muted-foreground) !important;
        font-family: 'Inter', monospace !important;
        font-size: 0.75rem !important;
      }

      .swagger-ui .parameter__in {
        color: var(--muted-foreground) !important;
        font-size: 0.75rem !important;
      }

      /* Tables */
      .swagger-ui table {
        border-collapse: collapse !important;
        width: 100% !important;
      }

      .swagger-ui table tbody tr {
        border-bottom: 1px solid var(--border) !important;
      }

      .swagger-ui table tbody tr td {
        color: var(--foreground) !important;
        padding: 0.75rem !important;
        font-size: 0.875rem !important;
      }

      .swagger-ui table thead tr th {
        color: var(--muted-foreground) !important;
        border-bottom: 1px solid var(--border) !important;
        background: var(--muted) !important;
        padding: 0.75rem !important;
        font-size: 0.75rem !important;
        font-weight: 600 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
      }

      /* Execute button */
      .swagger-ui .btn.execute {
        background: #18181b !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: var(--radius) !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
      }

      .swagger-ui .btn.execute:hover {
        background: #27272a !important;
      }

      [data-theme="dark"] .swagger-ui .btn.execute {
        background: #f5f5f5 !important;
        color: #0a0a0a !important;
      }

      [data-theme="dark"] .swagger-ui .btn.execute:hover {
        background: #e5e5e5 !important;
      }

      /* Cancel button */
      .swagger-ui .btn.cancel {
        background: transparent !important;
        color: #71717a !important;
        border: 1px solid #e4e4e7 !important;
        border-radius: var(--radius) !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
      }

      .swagger-ui .btn.cancel:hover {
        background: #f4f4f5 !important;
      }

      [data-theme="dark"] .swagger-ui .btn.cancel {
        color: #d4d4d4 !important;
        border-color: #333333 !important;
      }

      [data-theme="dark"] .swagger-ui .btn.cancel:hover {
        background: #262626 !important;
      }

      /* Response section */
      .swagger-ui .responses-wrapper {
        background: var(--card) !important;
        padding: 1rem !important;
      }

      .swagger-ui .response-col_status {
        font-family: 'Inter', monospace !important;
        font-weight: 600 !important;
        font-size: 0.8125rem !important;
      }

      .swagger-ui .response-col_description {
        color: var(--muted-foreground) !important;
        font-size: 0.8125rem !important;
      }

      /* Models */
      .swagger-ui .model-box {
        background: var(--card) !important;
        border-radius: var(--radius) !important;
        border: 1px solid var(--border) !important;
        padding: 1rem !important;
      }

      .swagger-ui .model {
        color: var(--foreground) !important;
        font-family: 'Inter', monospace !important;
        font-size: 0.8125rem !important;
      }

      .swagger-ui .model-title {
        color: var(--foreground) !important;
        font-weight: 600 !important;
        font-size: 0.875rem !important;
      }

      .swagger-ui .prop-name {
        color: var(--foreground) !important;
        font-weight: 500 !important;
      }

      .swagger-ui .prop-type {
        color: var(--muted-foreground) !important;
      }

      /* Input fields */
      .swagger-ui input[type=text],
      .swagger-ui input[type=password],
      .swagger-ui input[type=email],
      .swagger-ui textarea,
      .swagger-ui select {
        background: var(--background) !important;
        color: var(--foreground) !important;
        border: 1px solid var(--input) !important;
        border-radius: calc(var(--radius) - 2px) !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 0.875rem !important;
        font-family: 'Inter', monospace !important;
        transition: all 0.2s ease !important;
      }

      .swagger-ui input:focus,
      .swagger-ui textarea:focus,
      .swagger-ui select:focus {
        border-color: var(--ring) !important;
        outline: none !important;
        box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.05) !important;
      }

      [data-theme="dark"] .swagger-ui input:focus,
      [data-theme="dark"] .swagger-ui textarea:focus,
      [data-theme="dark"] .swagger-ui select:focus {
        box-shadow: 0 0 0 2px rgba(250, 250, 250, 0.1) !important;
      }

      /* Scrollbar */
      .swagger-ui ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .swagger-ui ::-webkit-scrollbar-track {
        background: var(--muted);
        border-radius: 4px;
      }

      .swagger-ui ::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 4px;
      }

      .swagger-ui ::-webkit-scrollbar-thumb:hover {
        background: var(--muted-foreground);
      }

      /* Links */
      .swagger-ui a {
        color: var(--foreground) !important;
        text-decoration: none !important;
        font-weight: 500 !important;
      }

      .swagger-ui a:hover {
        text-decoration: underline !important;
      }

      /* Modal */
      .swagger-ui .dialog-ux .modal-ux {
        background: var(--card) !important;
        border: 1px solid var(--border) !important;
        border-radius: var(--radius) !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
      }

      [data-theme="dark"] .swagger-ui .dialog-ux .modal-ux {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3) !important;
      }

      .swagger-ui .dialog-ux .modal-ux-header {
        border-bottom: 1px solid var(--border) !important;
        padding: 1rem !important;
      }

      .swagger-ui .dialog-ux .modal-ux-header h3 {
        color: var(--foreground) !important;
        font-weight: 600 !important;
        font-size: 1rem !important;
      }

      .swagger-ui .dialog-ux .modal-ux-content {
        color: var(--foreground) !important;
        padding: 1rem !important;
      }

      .swagger-ui .dialog-ux .modal-ux-content p,
      .swagger-ui .dialog-ux .modal-ux-content label,
      .swagger-ui .dialog-ux .modal-ux-content span,
      .swagger-ui .dialog-ux .modal-ux-content code {
        color: var(--foreground) !important;
      }

      .swagger-ui .dialog-ux .modal-ux-content h4 {
        color: var(--foreground) !important;
      }

      .swagger-ui .auth-container {
        color: var(--foreground) !important;
      }

      .swagger-ui .auth-container p,
      .swagger-ui .auth-container h4,
      .swagger-ui .auth-container h5,
      .swagger-ui .auth-container label {
        color: var(--foreground) !important;
      }

      .swagger-ui .auth-container code {
        color: #a855f7 !important;
        background: var(--muted) !important;
      }

      /* Try it out */
      .swagger-ui .try-out__btn {
        background: transparent !important;
        color: #09090b !important;
        border: 1px solid #e4e4e7 !important;
        border-radius: calc(var(--radius) - 2px) !important;
        padding: 0.375rem 0.75rem !important;
        font-size: 0.8125rem !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
      }

      .swagger-ui .try-out__btn:hover {
        background: #f4f4f5 !important;
      }

      [data-theme="dark"] .swagger-ui .try-out__btn {
        color: #f5f5f5 !important;
        border-color: #333333 !important;
      }

      [data-theme="dark"] .swagger-ui .try-out__btn:hover {
        background: #262626 !important;
      }

      /* Server dropdown */
      .swagger-ui .servers > label {
        color: var(--foreground) !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
      }

      .swagger-ui .servers select {
        background: var(--background) !important;
        color: var(--foreground) !important;
        border: 1px solid var(--input) !important;
      }

      /* Markdown */
      .swagger-ui .markdown p,
      .swagger-ui .markdown li {
        color: var(--muted-foreground) !important;
        font-size: 0.875rem !important;
        line-height: 1.6 !important;
      }

      .swagger-ui .markdown code {
        background: var(--muted) !important;
        color: var(--foreground) !important;
        padding: 0.125rem 0.375rem !important;
        border-radius: calc(var(--radius) - 4px) !important;
        font-family: 'Inter', monospace !important;
        font-size: 0.8125rem !important;
      }

      /* Tabs */
      .swagger-ui .tab li {
        color: var(--muted-foreground) !important;
        font-size: 0.875rem !important;
      }

      .swagger-ui .tab li.active {
        color: var(--foreground) !important;
        border-bottom: 2px solid var(--foreground) !important;
      }

      .swagger-ui .tab li button.tablinks {
        color: inherit !important;
        font-weight: 500 !important;
      }

      /* JSON syntax */
      .swagger-ui .microlight .string { color: #22c55e !important; }
      .swagger-ui .microlight .number { color: #f59e0b !important; }
      .swagger-ui .microlight .boolean { color: #a855f7 !important; }
      .swagger-ui .microlight .null { color: #ef4444 !important; }
      .swagger-ui .microlight .key { color: #60a5fa !important; }

      /* More text visibility fixes */
      .swagger-ui .opblock-description-wrapper p {
        color: var(--muted-foreground) !important;
      }

      .swagger-ui .opblock-external-docs-wrapper p {
        color: var(--muted-foreground) !important;
      }

      .swagger-ui .responses-inner h4,
      .swagger-ui .responses-inner h5 {
        color: var(--foreground) !important;
      }

      .swagger-ui .response-col_description__inner p,
      .swagger-ui .response-col_description__inner span {
        color: var(--foreground) !important;
      }

      .swagger-ui .model-container,
      .swagger-ui .model-container span {
        color: var(--foreground) !important;
      }

      .swagger-ui section.models h4 {
        color: var(--foreground) !important;
      }

      .swagger-ui .opblock-summary-control {
        color: var(--foreground) !important;
      }

      .swagger-ui .info__contact,
      .swagger-ui .info__license,
      .swagger-ui .info__tos {
        color: var(--muted-foreground) !important;
      }

      .swagger-ui .info__contact a,
      .swagger-ui .info__license a,
      .swagger-ui .info__tos a {
        color: #60a5fa !important;
      }

      /* Expand icons */
      .swagger-ui .expand-operation svg,
      .swagger-ui .authorization__btn svg {
        fill: var(--muted-foreground) !important;
      }

      /* Response timing */
      .swagger-ui .response-col_links {
        color: var(--muted-foreground) !important;
        font-size: 0.75rem !important;
      }
    `;

    // Theme toggle JavaScript - using customJsStr
    const themeToggleJs = `
      (function() {
        function getThemePreference() {
          var stored = localStorage.getItem('swagger-theme');
          if (stored) return stored;
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        function setTheme(theme) {
          document.documentElement.setAttribute('data-theme', theme);
          localStorage.setItem('swagger-theme', theme);
        }

        function createToggleButton() {
          if (document.getElementById('theme-toggle-btn')) return;
          
          var toggle = document.createElement('button');
          toggle.id = 'theme-toggle-btn';
          toggle.setAttribute('aria-label', 'Toggle theme');
          toggle.innerHTML = '<svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
          
          toggle.addEventListener('click', function() {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
          });
          
          document.body.appendChild(toggle);
        }

        function init() {
          var theme = getThemePreference();
          setTheme(theme);
          createToggleButton();
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
          if (!localStorage.getItem('swagger-theme')) {
            setTheme(e.matches ? 'dark' : 'light');
          }
        });
      })();
    `;

    // Swagger UI options
    const swaggerOptions = {
      explorer: true,
      customCss: themeWithToggle,
      customJsStr: themeToggleJs,
      customSiteTitle: "LMS Auth Service API",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
      }
    };

    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
    app.use('/api-docs/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
    
    app.use('/auth/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
    app.use('/auth/api/api-docs/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

    console.log('📄 Swagger Docs available at:');
    console.log('   - Direct: http://localhost:4001/api-docs');
    console.log('   - Via Kong: http://localhost:8000/auth/api/api-docs');
  } catch (error) {
    console.error('❌ Failed to load Swagger API documentation:', error);
    console.error('Error details:', error);
  }
};
