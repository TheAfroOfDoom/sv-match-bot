import simpleImportSort from "eslint-plugin-simple-import-sort"
import importPlugin from "eslint-plugin-import"
import tseslint from "typescript-eslint"
import eslint from "@eslint/js"

export default tseslint.config([
	eslint.configs.recommended,
	tseslint.configs.recommended,
	{
		files: ["**/*.ts"],
		extends: [
			importPlugin.flatConfigs.recommended,
			importPlugin.flatConfigs.typescript,
		],
		plugins: {
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/consistent-type-imports": "error",
			"import/first": "error",
			"import/newline-after-import": "error",
			"import/no-duplicates": "error",
			"simple-import-sort/imports": "error",
		},
	},
])
