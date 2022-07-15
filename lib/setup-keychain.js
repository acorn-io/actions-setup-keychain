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
const exec = __importStar(require("@actions/exec"));
const IS_MACOS = process.platform === 'darwin';
const IS_POST = !!process.env['STATE_isPost'];
const NAME = core.getInput('keychain-name');
const PASSWORD = core.getInput('keychain-password');
const TIMEOUT = core.getInput('keychain-timeout');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!IS_MACOS) {
                throw new Error(`${process.platform} is not supported!`);
            }
            if (IS_POST) {
                yield post();
            }
            else {
                yield main();
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
// -----------
function cleanLine(line) {
    return line.trim().replace(/^"/, '').replace(/"$/, '');
}
function cleanLines(lines) {
    return lines.split(/\n/).map(cleanLine);
}
function execThrow(cmd, args, msg, ok) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ok) {
            ok = [];
        }
        if (!Array.isArray(ok)) {
            ok = [ok];
        }
        const out = yield exec.getExecOutput(cmd, args);
        if (out.exitCode && !ok.includes(out.exitCode)) {
            throw new Error('Error ' + msg + ": " + out.stderr);
        }
        return out;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let out;
        out = yield execThrow('security', ['default-keychain'], 'getting default keychain');
        const def = cleanLine(out.stdout);
        out = yield execThrow('security', ['list-keychains'], 'listing keychains');
        const list = cleanLines(out.stdout);
        console.log("Saving default keychain:", def);
        core.saveState('default', def);
        core.saveState('list', list);
        out = yield execThrow('security', ['create-keychain', '-p', PASSWORD, NAME], 'creating keychain', 48);
        if (out.exitCode === 48) {
            console.log('Keychain already exists');
        }
        else {
            console.log('Created keychain');
        }
        yield execThrow('security', ['set-keychain-settings', '-t', TIMEOUT, '-u', NAME], 'setting keychain settings');
        yield execThrow('security', ['list-keychains', '-s', NAME, ...list]), 'listing keychains';
        yield execThrow('security', ['default-keychain', '-s', NAME], 'setting default keychain');
        out = yield execThrow('security', ['unlock-keychain', '-p', PASSWORD, NAME], 'unlocking keychain');
        core.setOutput('keychain-name', NAME);
        core.setOutput('keychain-password', PASSWORD);
    });
}
function post() {
    return __awaiter(this, void 0, void 0, function* () {
        const def = core.getState('default');
        const list = JSON.parse(core.getState('list')) || [];
        console.log('Locking keychain');
        yield exec.exec('security', ['lock-keychain', NAME]);
        if (list.length) {
            console.log('Restoring keychain list to:', list);
            yield exec.exec('security', ['list-keychains', '-s', ...list]);
        }
        if (def) {
            console.log('Restoring default keychain to:', def);
            yield exec.exec('security', ['default-keychain', '-s', def]);
        }
    });
}
