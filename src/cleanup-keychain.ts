import * as core from '@actions/core'
import { execThrow } from './utils'

const IS_MACOS = process.platform === 'darwin'
const NAME = core.getInput('keychain-name')

async function run() {
  try {
    if (!IS_MACOS) {
      throw new Error(`${process.platform} is not supported!`)
    }

    await post()
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

run()

async function post() {
  const def = core.getState('default')
  const list: string[] = JSON.parse(core.getState('list')) || []

  console.log('Locking keychain')
  await execThrow('security', ['lock-keychain', NAME], 'locking keychain')

  if (list.length) {
    console.log('Restoring keychain list to:', list)
    await execThrow('security', ['list-keychains', '-s', ...list], 'restoring keychain list')
  }

  if (def) {
    console.log('Restoring default keychain to:', def)
    await execThrow('security', ['default-keychain', '-s', def], 'restoring default keychain')
  }
}
