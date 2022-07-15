import * as core from '@actions/core'
import * as exec from '@actions/exec'

const IS_MACOS = process.platform === 'darwin'
const IS_POST = !!process.env['STATE_isPost']
const NAME = core.getInput('keychain-name')
const PASSWORD = core.getInput('keychain-password')
const TIMEOUT = core.getInput('keychain-timeout')

async function run() {
  try {
    if (!IS_MACOS) {
      throw new Error(`${process.platform} is not supported!`)
    }

    if (IS_POST) {
      await post()
    } else {
      await main()
    }
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()

// -----------

function cleanLine(line: string) {
  return line.trim().replace(/^"/, '').replace(/"$/, '')
}

function cleanLines(lines: string) {
  return lines.split(/\n/).map(cleanLine)
}

async function execThrow(cmd: string, args: string[], msg?: string, ok?: number | number[]): Promise<exec.ExecOutput> {
  if (!ok) {
    ok = []
  }

  if (!Array.isArray(ok)) {
    ok = [ok]
  }

  const out = await exec.getExecOutput(cmd, args)

  if (out.exitCode && !ok.includes(out.exitCode)) {
    throw new Error('Error ' + msg + ': ' + out.stderr)
  }

  return out
}

async function main() {
  let out: exec.ExecOutput

  out = await execThrow('security', ['default-keychain'], 'getting default keychain')
  const def = cleanLine(out.stdout)

  out = await execThrow('security', ['list-keychains'], 'listing keychains')
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

  await execThrow('security', ['set-keychain-settings', '-t', TIMEOUT, '-u', NAME], 'setting keychain settings')
  await execThrow('security', ['list-keychains', '-s', NAME, ...list]), 'listing keychains'
  await execThrow('security', ['default-keychain', '-s', NAME], 'setting default keychain')

  out = await execThrow('security', ['unlock-keychain', '-p', PASSWORD, NAME], 'unlocking keychain')

  core.setOutput('keychain-name', NAME)
  core.setOutput('keychain-password', PASSWORD)
}

async function post() {
  const def = core.getState('default')
  const list: string[] = JSON.parse(core.getState('list')) || []

  console.log('Locking keychain')
  await exec.exec('security', ['lock-keychain', NAME])

  if (list.length) {
    console.log('Restoring keychain list to:', list)
    await exec.exec('security', ['list-keychains', '-s', ...list])
  }

  if (def) {
    console.log('Restoring default keychain to:', def)
    await exec.exec('security', ['default-keychain', '-s', def])
  }
}
