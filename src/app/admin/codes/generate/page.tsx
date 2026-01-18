import { generateCode } from './action'

export default function GenerateCodePage() {
  return (
    <div>
      <h1>إنشاء كود جديد</h1>

      <form action={generateCode}>
        <select name="type" required>
          <option value="subscription">كود اشتراك</option>
          <option value="course">كود كورس</option>
          <option value="lesson">كود محاضرة</option>
        </select>

        <input
          type="text"
          name="target_id"
          placeholder="ID (اختياري)"
        />

        <button type="submit">إنشاء الكود</button>
      </form>
    </div>
  )
}
