import { ipcMain } from 'electron'
import {
  listInstances,
  getInstanceById,
  createAndSaveInstance,
  updateInstance,
  deleteInstance,
} from '../services/instance-store'
import type { CreateInstanceInput, Instance } from '@refract/core'

export function registerInstanceIpc(): void {
  ipcMain.handle('instance.list', () => listInstances())

  ipcMain.handle('instance.getById', (_event, id: string) => getInstanceById(id))

  ipcMain.handle('instance.create', (_event, input: CreateInstanceInput) =>
    createAndSaveInstance(input)
  )

  ipcMain.handle(
    'instance.update',
    (_event, id: string, patch: Partial<Omit<Instance, 'id' | 'createdAt'>>) =>
      updateInstance(id, patch)
  )

  ipcMain.handle(
    'instance.delete',
    (_event, id: string, deleteFiles: boolean) => {
      deleteInstance(id, deleteFiles)
    }
  )
}
