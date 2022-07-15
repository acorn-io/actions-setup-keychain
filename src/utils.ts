import * as exec from '@actions/exec'

export function cleanLine(line: string) {
  return line.trim().replace(/^"/, '').replace(/"$/, '')
}

export function cleanLines(lines: string) {
  return lines.split(/\n/).map(cleanLine)
}

export async function execThrow(cmd: string, args: string[], msg?: string, ok?: number | number[]): Promise<exec.ExecOutput> {
  if (!ok) {
    ok = []
  }

  if (!Array.isArray(ok)) {
    ok = [ok]
  }

  const out = await exec.getExecOutput(cmd, args, {ignoreReturnCode: true})

  if (out.exitCode && !ok.includes(out.exitCode)) {
    throw new Error('Error ' + msg + ': ' + out.stderr)
  }

  return out
}
