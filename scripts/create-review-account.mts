// 카드사 심사용 계정을 만든다.
//
// 토스페이먼츠는 심사에 쓸 ID/PW 계정을 요구하고, 카카오·구글 같은 소셜 계정은 받지 않는다.
// 가입 화면으로 만들면 이메일 확인 메일을 받아야 하므로, 서버 키로 확인된 상태로 바로 만든다.
//
//   pnpm account:review review@example.com '비밀번호'
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("사용법: pnpm account:review <이메일> <비밀번호>");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다 (.env.local).");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  // 확인 메일을 거치지 않고 바로 쓸 수 있게 한다
  email_confirm: true,
  user_metadata: { name: "심사용 계정" },
});

if (error) {
  // 이미 있으면 비밀번호만 맞춰 준다 — 심사 중에 비밀번호를 잊어도 다시 돌리면 된다
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users.find((user) => user.email === email);
  if (!existing) {
    console.error("계정을 만들지 못했습니다:", error.message);
    process.exit(1);
  }
  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (updateError) {
    console.error("비밀번호를 바꾸지 못했습니다:", updateError.message);
    process.exit(1);
  }
  console.log(`이미 있던 계정의 비밀번호를 새로 맞췄습니다: ${email}`);
  process.exit(0);
}

console.log(`심사용 계정을 만들었습니다: ${data.user?.email}`);
