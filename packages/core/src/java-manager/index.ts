export interface JavaInstallation {
  version: number
  path: string
  vendor: string
}

export async function detectJavaInstallations(): Promise<JavaInstallation[]> {
  throw new Error('Not implemented')
}
