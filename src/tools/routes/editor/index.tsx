import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/editor/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/editor/tsx/"!</div>
}
