// @ts-check

import tseslint from 'typescript-eslint';

export default tseslint.config(
    tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules:{
            "@typescript-eslint/prefer-for-of": "off"
        }
    }
);