const OFF = 0, WARN = 1, warn = 2;

module.exports = {
	"root": true,
	"parser": "@typescript-eslint/parser",
	"plugins": [
		"@typescript-eslint"
	],
	"env": {
		"browser": true,
		"node": true
	},
	"extends": [
		// "eslint:recommended",
		// "plugin:@typescript-eslint/eslint-recommended",
		// "plugin:@typescript-eslint/recommended"
	],
	"rules": {
		/* typescript */
		"@typescript-eslint/member-delimiter-style": [
			"off",
			{
				"multiline": {
					"delimiter": "semi",
					"requireLast": false
				},
				"singleline": {
					"delimiter": "semi",
					"requireLast": false
				}
			}
		],

		/* functional */
		// "fp/no-arguments": "warn",
		// "fp/no-class": "warn",
		// "fp/no-delete": "warn",
		// "fp/no-events": "warn",
		// "fp/no-get-set": "warn",
		// "fp/no-let": "warn",
		// "fp/no-loops": "warn",
		// "fp/no-mutating-assign": "warn",
		// "fp/no-mutating-methods": "warn",
		// "fp/no-mutation": "warn",
		// "fp/no-nil": "warn",
		// "fp/no-proxy": "warn",
		// "fp/no-rest-parameters": "off",
		// "fp/no-this": "warn",
		// "fp/no-throw": "warn",
		// "fp/no-unused-expression": "warn",
		// "fp/no-valueof-field": "warn",

		/* general */
		"no-var": "warn",
		"no-console": "off",
		"no-unused-vars": "warn",
		"no-unused-expressions": "warn",
		"no-unused-labels": "warn",
		"no-await-in-loop": "warn",
		"no-irregular-whitespace": "warn",
		"no-unexpected-multiline": "warn",
		"no-template-curly-in-string": "warn",
		"no-unsafe-negation": "warn",
		"require-atomic-updates": "warn",
		"no-import-assign": "warn",
		"no-unreachable": "warn",
		"init-declarations": [ "warn", "always" ],
		"no-shadow": "warn",
		"no-undef-init": "off",

		/* code style */
		"semi": [ "warn", "never" ],
		"brace-style": ["warn","stroustrup"],
		"camelcase": ["warn", {
				"properties": "always",
				"ignoreImports": true
		}],
		"block-spacing": ["warn", "always"],
		//"indent": ["warn", "tab"]
	}
}