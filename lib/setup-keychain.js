"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const utils_1 = require("./utils");
const IS_MACOS = process.platform === 'darwin';
const NAME = core.getInput('name');
const PASSWORD = core.getInput('password');
const SCOPE = core.getInput('scope');
const TIMEOUT = core.getInput('timeout');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!IS_MACOS) {
                throw new Error(`${process.platform} is not supported!`);
            }
            yield main();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let out;
        out = yield (0, utils_1.execThrow)('security', ['default-keychain', '-d', SCOPE], 'getting default keychain');
        const def = (0, utils_1.cleanLine)(out.stdout);
        out = yield (0, utils_1.execThrow)('security', ['list-keychains', '-d', SCOPE], 'listing keychains');
        const list = (0, utils_1.cleanLines)(out.stdout);
        console.log('Saving default keychain:', def);
        core.saveState('default', def);
        core.saveState('list', list);
        out = yield (0, utils_1.execThrow)('security', ['create-keychain', '-p', PASSWORD, NAME], 'creating keychain', 48);
        if (out.exitCode === 48) {
            console.log('Keychain already exists');
        }
        else {
            console.log('Created keychain');
        }
        yield (0, utils_1.execThrow)('security', ['unlock-keychain', '-p', PASSWORD, NAME], 'unlocking keychain');
        yield (0, utils_1.execThrow)('security', ['set-keychain-settings', '-t', TIMEOUT, '-u', NAME], 'setting keychain settings');
        yield (0, utils_1.execThrow)('security', ['list-keychains', '-d', SCOPE, '-s', NAME, ...list]), 'listing keychains';
        yield (0, utils_1.execThrow)('security', ['default-keychain', '-d', SCOPE, '-s', NAME], 'setting default keychain');
        core.setOutput('keychain-name', NAME);
        core.setOutput('keychain-password', PASSWORD);
    });
}
