import { createPlan } from './action'

export default function Page() {
  return (
    <form action={createPlan}>
      <input name="name" placeholder="Name" />
      <input name="duration_days" type="number" />
      <button>Create</button>
    </form>
  )
}
