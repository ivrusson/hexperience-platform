import { Box, render, Text } from 'ink'
import { useEffect, useState } from 'react'
import { ModelEditor } from '../tui/components/ModelEditor'
import { MonorepoManager } from '../tui/components/MonorepoManager'
import { ProjectCreator } from '../tui/components/ProjectCreator'
import { findUserProject } from '../utils/findUserProject'

interface TuiOptions {
  subcommand?: string
}

function TuiApp() {
  const [mode, setMode] = useState<'create' | 'models' | 'monorepo'>('create')
  const [projectPath, setProjectPath] = useState<string | undefined>()

  if (mode === 'create') {
    return (
      <ProjectCreator
        onContinueToModels={(path) => {
          setProjectPath(path)
          setMode('models')
        }}
      />
    )
  }

  if (mode === 'models') {
    return <ModelEditor projectPath={projectPath} />
  }

  if (mode === 'monorepo') {
    return <MonorepoManager />
  }

  return null
}

function ModelsEditorWithAutoDetect() {
  const [projectPath, setProjectPath] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const detectProject = async () => {
      try {
        const projectPath = await findUserProject(process.cwd())
        if (projectPath) {
          setProjectPath(projectPath)
        } else {
          setError(
            'No Hexperience project found. Make sure you are in a project directory.'
          )
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to detect project'
        )
      } finally {
        setLoading(false)
      }
    }

    detectProject()
  }, [])

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">Detecting project...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red" bold>
          Error: {error}
        </Text>
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Make sure you are in a Hexperience project directory or create a new
            project with 'create-hexp tui create'
          </Text>
        </Box>
      </Box>
    )
  }

  return <ModelEditor projectPath={projectPath} />
}

export async function tuiCommand(options: TuiOptions): Promise<void> {
  const subcommand = options.subcommand || 'create'

  if (subcommand === 'create') {
    render(<TuiApp />)
  } else if (subcommand === 'models') {
    render(<ModelsEditorWithAutoDetect />)
  } else if (subcommand === 'monorepo') {
    render(<MonorepoManager />)
  } else {
    process.exit(1)
  }
}
