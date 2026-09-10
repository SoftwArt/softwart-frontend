// Contenido de ProfileModal.tsx llevado inline a esta página — editar datos,
// cambiar contraseña y eliminar cuenta ya no son un modal: es lo único que
// hace esta sección, así que vive directamente acá. La info de contacto del
// taller (que no es del cliente) se movió al pie del sidebar (AccountSidebar).
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertTriangle, Lock, User } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/src/shared/components/ui/alert-dialog'
import { FieldErrorTooltip } from '@/src/shared/components/FieldErrorTooltip'
import { PasswordChecklist } from '@/src/shared/components/PasswordChecklist'
import { Skeleton } from '@/src/shared/components/ui/skeleton'
import { stripDigits, NOMBRE_MAX_LENGTH, NOMBRE_MAX_ERROR } from '@/src/shared/lib/validateNombre'
import { onlyDigits } from '@/src/shared/lib/validateTelefono'
import { inputCls, labelCls } from '../utils'
import type { AccountOutletContext } from './AccountLayout'

export function CuentaPage() {
  const {
    isLoading,
    perfilNombre, setPerfilNombre, perfilTelefono, setPerfilTelefono,
    perfilCorreo, setPerfilCorreo, perfilErrors, isSavingPerfil, submitPerfil,
    claveActual, setClaveActual, claveNueva, setClaveNueva, claveConfirm, setClaveConfirm,
    isSavingClave, submitClave, isDeleting, onDeleteAccount,
  } = useOutletContext<AccountOutletContext>()

  return (
    <div className="h-full overflow-y-auto p-6">
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-secondary">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground mt-1">Tus datos y tu seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-serif text-secondary">Mis datos</h2>
          </div>
          {isLoading ? (
            <div className="space-y-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <form onSubmit={submitPerfil} className="space-y-5" noValidate>
              <div>
                <label className={labelCls} htmlFor="perfil-nombre">Nombre completo</label>
                <FieldErrorTooltip error={perfilErrors.nombre || (perfilNombre.length >= NOMBRE_MAX_LENGTH ? NOMBRE_MAX_ERROR : null)}>
                  <input
                    id="perfil-nombre"
                    type="text"
                    value={perfilNombre}
                    onChange={e => setPerfilNombre(stripDigits(e.target.value))}
                    required
                    maxLength={NOMBRE_MAX_LENGTH}
                    className={inputCls}
                  />
                </FieldErrorTooltip>
              </div>
              <div>
                <label className={labelCls} htmlFor="perfil-telefono">
                  Teléfono <span className="text-destructive">*</span>
                </label>
                <FieldErrorTooltip error={perfilErrors.telefono}>
                  <input
                    id="perfil-telefono"
                    type="tel"
                    value={perfilTelefono}
                    onChange={e => setPerfilTelefono(onlyDigits(e.target.value))}
                    required
                    className={inputCls}
                  />
                </FieldErrorTooltip>
              </div>
              <div>
                <label className={labelCls} htmlFor="perfil-correo">Correo electrónico</label>
                <FieldErrorTooltip error={perfilErrors.correo}>
                  <input
                    id="perfil-correo"
                    type="email"
                    value={perfilCorreo}
                    onChange={e => setPerfilCorreo(e.target.value)}
                    required
                    className={inputCls}
                  />
                </FieldErrorTooltip>
              </div>
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSavingPerfil}
                  className="bg-secondary text-secondary-foreground py-2.5 px-6 rounded-lg font-medium hover:bg-secondary/90 transition-colors active:scale-95 disabled:opacity-60"
                >
                  {isSavingPerfil ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-serif text-secondary">Cambiar contraseña</h2>
          </div>
          <form onSubmit={submitClave} className="space-y-5">
            <div>
              <label className={labelCls} htmlFor="clave-actual">Contraseña actual</label>
              <input
                id="clave-actual"
                type="password"
                value={claveActual}
                onChange={e => setClaveActual(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="clave-nueva">Nueva contraseña</label>
              <input
                id="clave-nueva"
                type="password"
                value={claveNueva}
                onChange={e => setClaveNueva(e.target.value)}
                className={inputCls}
              />
              <PasswordChecklist password={claveNueva} confirmPassword={claveConfirm} />
            </div>
            <div>
              <label className={labelCls} htmlFor="clave-confirm">Confirmar contraseña</label>
              <input
                id="clave-confirm"
                type="password"
                value={claveConfirm}
                onChange={e => setClaveConfirm(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSavingClave}
                className="w-full border-2 border-primary/30 text-primary py-2.5 rounded-lg font-medium hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                {isSavingClave ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="border border-destructive/20 rounded-xl p-6 bg-destructive/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="font-serif text-lg text-destructive">Eliminar cuenta</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta acción es permanente. Si tienes historial activo, la cuenta se desactivará en su lugar.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isDeleting}
                className="text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
              >
                {isDeleting ? 'Procesando...' : 'Eliminar cuenta'}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card text-card-foreground border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-secondary">¿Eliminar tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es permanente y eliminará toda tu información. Si tienes historial activo, la cuenta se desactivará en su lugar.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border text-foreground">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={async () => {
                    try {
                      const message = await onDeleteAccount()
                      toast.success(message)
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Error al eliminar la cuenta')
                    }
                  }}
                >
                  Sí, eliminar cuenta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
    </div>
  )
}
