import { render } from 'ink'
import { ModelEditor } from '../tui/components/ModelEditor.js'
import { MonorepoManager } from '../tui/components/MonorepoManager.js'

interface TuiOptions {
  subcommand?: string
}

export async function tuiCommand(options: TuiOptions): Promise<void> {
  const subcommand = options.subcommand || 'models'

  if (subcommand === 'models') {
    render(<ModelEditor />)
  } else if (subcommand === 'monorepo') {
    render(<MonorepoManager />)
  } else {
    process.exit(1)
  }
}
