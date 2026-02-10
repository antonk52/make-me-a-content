// Type definition for RegExp.escape() - available in Node.js 24+
// This can be removed once TypeScript and @types/node include it in their definitions
interface RegExpConstructor {
	escape(str: string): string;
}
