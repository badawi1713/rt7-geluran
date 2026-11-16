import { BrandMark } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/features/auth/auth-provider'

const schema = z.object({
  no_wa: z.string().trim().min(1, 'Diharuskan untuk mengisi nomor Whatsapp.'),
  password: z.string().min(1, 'Diharuskan untuk memasukkan password.'),
})
type FormValues = z.infer<typeof schema>

const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15189.128380529874!2d112.68188307573257!3d-7.362891145274552!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7e347a02654f7%3A0x2c352fd612095d9a!2sGeluran%2C%20Taman%2C%20Sidoarjo%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1689827185756!5m2!1sen!2sid'

export function SignInPage() {
  const { status, signIn, isSigningIn } = useAuth()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { no_wa: '', password: '' } })

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/sign-in' ? from : '/beranda'} replace />
  }

  // Errors are toasted by the mutation cache.
  const onSubmit = form.handleSubmit((values) => signIn(values).catch(() => undefined))

  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <ThemeToggle className="absolute top-3 right-3 size-10" />
        <div className="w-full max-w-sm">
          <BrandMark className="size-12" />
          <p className="mt-5 text-sm font-medium text-primary">RT 7 Geluran · Taman, Sidoarjo</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Masuk</h1>
          <p className="mt-2 text-sm text-muted-foreground">Gunakan nomor Whatsapp yang terdaftar di pengurus RT.</p>

          <form onSubmit={onSubmit} noValidate className="mt-8">
            <FieldGroup>
              <Controller
                name="no_wa"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="no_wa">No. Whatsapp</FieldLabel>
                    <Input
                      {...field}
                      id="no_wa"
                      type="tel"
                      inputMode="tel"
                      autoComplete="username"
                      autoFocus
                      placeholder="08xxxxxxxxxx"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-xs"
                          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                          onClick={() => setShowPassword((value) => !value)}
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Button type="submit" size="lg" className="w-full" disabled={isSigningIn}>
                {isSigningIn && <Spinner />}
                {isSigningIn ? 'Harap menunggu' : 'Masuk'}
              </Button>
            </FieldGroup>
          </form>
        </div>
      </main>

      <aside className="relative hidden overflow-hidden bg-neutral-900 md:block">
        <iframe
          src={MAP_SRC}
          title="Peta Geluran, Taman, Sidoarjo"
          className="absolute inset-0 size-full border-0 grayscale"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          tabIndex={-1}
          aria-hidden
        />
        <div className="absolute inset-0 bg-neutral-950/80" />
        <div className="relative flex h-full flex-col justify-end p-12 text-neutral-50">
          <h2 className="text-5xl font-semibold tracking-tight">Selamat datang,</h2>
          <p className="mt-4 max-w-md text-lg text-neutral-300">
            Dashboard manajemen untuk keperluan perekapan data RT 7 Geluran, Sidoarjo.
          </p>
          <p className="mt-8 max-w-md text-sm text-neutral-400">
            Ben pak RT senang dan dimudahkan untuk merekap data warganya!
          </p>
        </div>
      </aside>
    </div>
  )
}
