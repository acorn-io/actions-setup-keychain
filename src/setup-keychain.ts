import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { cleanLine, cleanLines, execThrow } from './utils'

const IS_MACOS = process.platform === 'darwin'
const NAME = core.getInput('name')
const PASSWORD = core.getInput('password')
const SCOPE = core.getInput('scope')
const TIMEOUT = core.getInput('timeout')

async function run() {
  try {
    if (!IS_MACOS) {
      throw new Error(`${process.platform} is not supported!`)
    }

    await main()
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()

async function main() {
  let out: exec.ExecOutput

  out = await execThrow('security', ['default-keychain', '-d', SCOPE], 'getting default keychain')
  const def = cleanLine(out.stdout)

  out = await execThrow('security', ['list-keychains', '-d', SCOPE], 'listing keychains')
  const list = cleanLines(out.stdout)

  console.log('Saving default keychain:', def)
  core.saveState('default', def)
  core.saveState('list', list)

  out = await execThrow('security', ['create-keychain', '-p', PASSWORD, NAME], 'creating keychain', 48)
  if (out.exitCode === 48) {
    console.log('Keychain already exists')
  } else {
    console.log('Created keychain')
  }

  await execThrow('security', ['unlock-keychain', '-p', PASSWORD, NAME], 'unlocking keychain')
  await execThrow('security', ['set-keychain-settings', '-t', TIMEOUT, '-u', NAME], 'setting keychain settings')
  await execThrow('security', ['list-keychains', '-d', SCOPE, '-s', NAME, ...list]), 'listing keychains'
  await execThrow('security', ['default-keychain', '-d', SCOPE, '-s', NAME], 'setting default keychain')


  core.setOutput('keychain-name', NAME)
  core.setOutput('keychain-password', PASSWORD)
}
