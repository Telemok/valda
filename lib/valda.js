/**
 * @file    valda.js
 * @brief   JS library for fast short easy analyse, assert, check, validate, parse data
 * @author  Dmitrii Arshinnikov <www.telemok.com@gmail.com> https://github.com/Telemok
 * @version 0.1
 * @date 2022-12-02
 *
@verbatim
			Copyright (c) 2022 telemok.com Dmitrii Arshinnikov

			Licensed under the Apache License, Version 2.0(the "License");
			you may not use this file except in compliance with the License.
			You may obtain a copy of the License at

			http://www.apache.org/licenses/LICENSE-2.0

			Unless required by applicable law or agreed to in writing, software
			distributed under the License is distributed on an "AS IS" BASIS,
			WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
			See the License for the specific language governing permissions and
			limitations under the License.
@endverbatim
 */

class Valda {

	static analyse(value, ...args) {
		throw new Error(`This function must be implemented`);
	}
	static is(...args) {
		let result = this.analyse(...args);
		if (result.name)
			return false;/*Return false is not OK.*/
		return true;/*Return true - is OK*/
	}
	static whyNot(...args) {
		let result = this.analyse(...args);
		if (result.name)
			return result.cause;/*Return description is not OK.*/
		return false;/*Return false - is OK*/
	};
	static codeWhyNot(...args){
		let result = this.analyse(...args);
		if (result.name)
			return result.name;/*Return CodeText is not OK.*/
		return false;/*Return false - is OK*/
	};
	static assert(...args){
		let result = this.analyse(...args);
		if (result.name) {
			let error = new TypeError(result.cause)
			error.name = result.name;
			error.cause = result.cause;
			if (typeof result.argument0 === 'function')
				return result.argument0(error);
			if (typeof result.argument0 === 'string')
				error.message = result.argument0;
			throw error;
		}
		return result.value;/*Return value - if OK*/
	};
	static parse(parameters, key, ...args){
		valda.object.assert(parameters, (error) => { error.message = `first parameter of parse must be object`; throw error });
		let value = parameters[key];
		let result = this.analyse(value, ...args);
		if (result.name) {
			let error = new TypeError(result.cause)
			error.name = result.name;
			error.cause = result.cause;
			if (result.argument0 === undefined)
				throw error;
			if (typeof result.argument0 === 'function')
				return result.argument0(error);
			else if (typeof result.argument0 === 'string') {
				error.message = result.argument0;
				throw error;
			}
			throw new Error(`valda.parse(callback must be string or function)`);
		}
		return result.value;/*Return value - if OK*/
	};
	static factory(callbackAnalyse)
	{
		if(typeof callbackAnalyse !== 'function')
			throw new Error(`callbackAnalyse must be function.`);

		return class valdaTmp extends Valda {
			static analyse(value, ...args) {
				return callbackAnalyse(value, ...args);
			}
		}
	}
}


export const valda = {};

Object.defineProperty(valda, "Valda", {value: Valda, enumerable: false});

valda.defined = Valda.factory((value, argument0) => {
	let result = {
		argument0: argument0,
	}
	if (value === undefined) {/*typeof value === 'undefined' - is too slow*/
		result.cause = `typeof is "undefined"`;/*text error description*/
		result.name = "IS_UNDEFINED";/*false if ok, or text error code in caps.*/
		return result;
	}
	else {
		result.name = false;
		result.value = value;
	}
	return result;
});

valda.boolean = Valda.factory((value, argument0) => {
	let result = valda.defined.analyse(value, argument0);
	if (!result.name) {
		if (result.value === "1" || result.value === 1 || result.value === true || result.value === 'true') {
			result.value = true;
		}
		else if (result.value === "0" || result.value === 0 || result.value === false || result.value === 'false') {
			result.value = false;
		}
		else {
			result.cause = `Value not boolean. Only allowed: false, true, 0, 1, "0", "1", "false", "true".`;
			result.name = "IS_NOT_BOOLEAN";
		}
	}
	return result;
});

valda.number = Valda.factory((value, argument0) => {
	let result = valda.defined.analyse(value, argument0);
	if (!result.name) {
		if (typeof result.value === 'number') {
			/*if (Number.isNaN(result.value)) { what do with NaN and "Nan"?
				result.cause = `Number can not be NaN (not a number).`;
				result.name = "NOT_A_NUMBER";
			}*/
		}
		else if (typeof result.value === 'boolean') {
			result.value = result.value - 0;
		}
		else if (typeof result.value === 'string') {
			let value2 = result.value - 0;
			//console.log("value2", value2)
			let str = value2 + "";
			if (str === result.value) {
				result.value = value2;
			}
			else {
				let shortResult = result.value.length > 10 ? result.value.substr(0, 10) + "..." : result.value;
				result.cause = `Can not parse string: "${shortResult}" to number.`;
				result.name = "WRONG_STRING_TO_NUMBER";
			}
		}
		else {
			result.cause = `Can not parse wrong type: "${typeof result.value}" to number.`;
			result.name = "WRONG_TYPE_TO_NUMBER";
		}
	}
	return result;
});




valda.numberMinMax = Valda.factory((value, minimal = Number.NEGATIVE_INFINITY, maximal = Number.POSITIVE_INFINITY, argument0) => {
		let result = valda.number.analyse(value, argument0);
		if (!result.name) {
			if (!(result.value >= minimal)) {
				result.cause = `Value (${result.value}) must be >= (${minimal})`;
				result.name = "IS_LESS_MINIMUM";
			}
			else if (!(result.value <= maximal)) {
				result.cause = `Value (${result.value}) must be <= (${maximal})`;
				result.name = "IS_GREATER_MAXIMNUM";
			}
		}
		return result;
});

valda.numberMin = Valda.factory((value, minimal = Number.NEGATIVE_INFINITY, argument0) => {
		return valda.numberMinMax.analyse(value, minimal, Number.POSITIVE_INFINITY, argument0);
});

valda.numberMax = Valda.factory((value, maximal = Number.POSITIVE_INFINITY, argument0) => {
		return valda.numberMinMax.analyse(value, Number.NEGATIVE_INFINITY, maximal, argument0);
});
valda.integerMinMax = Valda.factory((value, minimal = Number.MIN_SAFE_INTEGER, maximal = Number.MAX_SAFE_INTEGER, argument0) => {
		let result = valda.numberMinMax.analyse(value, minimal, maximal, argument0);
		if (!result.name) {
			if (result.value % 1 !== 0) {
				result.cause = `Value (${result.value}) must be integer.`;
				result.name = "IS_NOT_INTEGER";
			}
		}
		return result;
});
valda.integer = Valda.factory((value, argument0) => {
		return valda.integerMinMax.analyse(value, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, argument0);
});
valda.integerMin = Valda.factory((value, minimal = Number.MIN_SAFE_INTEGER, argument0) => {
		return valda.integerMinMax.analyse(value, minimal, Number.MAX_SAFE_INTEGER, argument0);
});
valda.integerMax = Valda.factory((value, maximal = Number.MAX_SAFE_INTEGER, argument0) => {
		return valda.integerMinMax.analyse(value, Number.MIN_SAFE_INTEGER, maximal, argument0);
});

valda.object = Valda.factory((value, argument0) => {
		let result = valda.defined.analyse(value, argument0);
		if (!result.name) {
			if (typeof result.value !== 'object') {
				result.cause = `Type (${typeof result.value}) must be "object"`;
				result.name = "IS_NOT_OBJECT";
			}
			else if (value === null) {/* Object must have at least 0 properties to parse. */
				result.cause = `Type (${typeof result.value}) must be "object" and not null.`;
				result.name = "IS_NULL";
			}
		}
		return result;
});

valda.array = Valda.factory((value, argument0) => {
		let result = valda.object.analyse(value, argument0);
		if (!result.name) {
			if (!(result.value instanceof Array)) {
				result.cause = `Value not instaceof Array.`;
				result.name = "IS_NOT_ARRAY";
			}
		}
		return result;
});

valda.uint8Array = Valda.factory((value, argument0) => {
		let result = valda.object.analyse(value, argument0);
		if (!result.name) {
			if (result.value.constructor !== Uint8Array) {
				result.cause = `Value not Uint8Array.`;
				result.name = "IS_NOT_UINT8ARRAY";
			}
		}
		return result;
});

valda.string = Valda.factory((value, argument0) => {
		let result = valda.defined.analyse(value, argument0);
		if (!result.name) {
			if (typeof result.value !== 'string') {
				result.cause = `Typeof value "${typeof result.value}" must be "string".`;
				result.name = "IS_NOT_STRING";
			}
		}
		return result;
});

valda.function = Valda.factory((value, argument0) => {
		let result = valda.defined.analyse(value, argument0);
		if (!result.name) {
			if (typeof result.value !== 'function') {
				result.cause = `Typeof value "${typeof result.value}" must be "function".`;
				result.name = "IS_NOT_FUNCTION";
			}
		}
		return result;
});

valda.extends = Valda.factory((value, ParentClass, argument0) => {
		let result = valda.function.analyse(value, argument0);
		if (!result.name) {
			if (!(result.value.prototype instanceof ParentClass)) {
				if (typeof ParentClass === 'function') {
					result.cause = `Function must have prototype in "${ParentClass.name}".`;
					result.name = "WRONG_PROTOTYPE";
				}
				else {
					result.cause = `Wrong prototype, typeof = "${typeof ParentClass}".`;
					result.name = "PROTOTYPE_NOT_FUNCTION";
				}
			}
		}
		return result;
});

valda.instance = Valda.factory((value, Class, argument0) => {
		let result = valda.object.analyse(value, argument0);//TODO check Class is class valda.assert.function(Class, errorPrefix)
		if (!result.name) {
			if (!(result.value instanceof Class)) {
				if (typeof Class === 'function') {
					result.cause = `Object must be instance of "${Class.name}".`;//let name = valda.validate.varName(Class.name) ? Class.name : "class";
					result.name = "MUST_BE_INSTANCEOF";
				}
				else {
					result.cause = `Wrong prototype, typeof = "${typeof Class}".`;
					result.name = "CLASS_NOT_FUNCTION";
				}
			}
		}
		return result;
});

	const tbrAssertVarNameRegex = new RegExp(/^([a-zA-Z_]+)([a-zA-Z0-9_]*)$/);
valda.varName = Valda.factory((value, argument0) => {
		let result = valda.string.analyse(value, argument0);
		if (!result.name) {
			if (!tbrAssertVarNameRegex.test(result.value)) {
				result.cause = `must be varname /^([a-zA-Z_]+)([a-zA-Z0-9_]*)$/`;
				result.name = "MUST_BE_VARNAME";
			}
		}
		return result;
});

	const tbrAssertHexRegex = /^([0-9A-F]*)$/i;
valda.hex = Valda.factory((value, argument0) => {
		let result = valda.string.analyse(value, argument0);
		if (!result.name) {
			if (result.value.length % 2 !== 0) {
				result.cause = `Hex length must be even, but now length = ${result.value.length}`;
				result.name = "HEX_LENGTH_MUST_BE_EVEN";
			}
			if (!tbrAssertHexRegex.test(result.value)) {
				result.cause = `must be (/^([0-9A-F]*)$/i`;
				result.name = "MUST_BE_HEX";
			}
		}
		return result;
});

valda.hexFixed = Valda.factory((value, sizeBytes, argument0) => {
		let result = valda.hex.analyse(value, argument0);
		if (!result.name) {
			if (result.value.length !== (sizeBytes * 2)) {
				result.cause = `Hex string length must be ${sizeBytes * 2} chars or ${sizeBytes} bytes, but now: ${result.value.length} chars.`;
				result.name = "HEX_OK_LENGTH_BAD";
			}
		}
		return result;
});

valda.enum = Valda.factory((value, enumArray, argument0) => {
		let result = valda.defined.analyse(value, argument0);
		if (!result.name) {
			if (enumArray instanceof Set) {
				if (!enumArray.has(result.value)) {
					result.cause = `key "${result.value}" not found in enum (Set) [${Array.from(enumArray).join(", ")}]`;
					result.name = "NO_KEY_IN_SET";
				}
			}
			else if (enumArray instanceof Map) {
				if (!enumArray.has(result.value)) {
					result.cause = `key "${result.value}" not found in enum (Map) [${Array.from(enumArray, keys()).join(", ")}]`;
					result.name = "NO_KEY_IN_MAP";
				}
			}
			//enumArray = valda.assert.array.analyse(enumArray, errorPrefix);//TOOD varName?
			else {
				if (!(enumArray.some((tmp) => { return tmp === result.value; }))) {
					result.cause = `key "${result.value}" not found in enum (Array) [${enumArray.join(", ")}]`;
					result.name = "NO_KEY_IN_ENUM";
				}
			}
		}
		return result;
});

valda.element = Valda.factory((value, argument0) => {
		let result = valda.object.analyse(value, argument0);
		if (!result.name) {
			if (document.body.baseURI !== value.baseURI) {
				result.cause = `This object must be element with (document.body.baseURI === value.baseURI).`;
				result.name = "OBJECT_NOT_ELEMENT";
			}
		}
		return result;
});
