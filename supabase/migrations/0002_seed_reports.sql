-- scripts/generate-report-seed.mts 가 lib/reports/catalog.ts 에서 생성한 파일입니다. 직접 수정하지 마세요.
insert into public.reports (slug, kind, category, title, tagline, price, original_price, discount_label, description)
values
  ('reunion-deep', 'report', 'reunion', '재회사주 심층', '그 사람은 왜 연락을 멈췄을까?', 14900, 24000, '38% OFF', '헤어진 상대의 명식까지 함께 펼쳐, 지금 그 사람 마음에 남아 있는 것과 빗장이 풀리는 시기, 먼저 연락하면 안 되는 이유까지 짚어 드려요.'),
  ('reunion', 'report', 'reunion', '재회사주', '우리 다시 만날 수 있을까?', 12900, null, null, '그 사람의 지금 연애관과, 연락이 닿기 쉬운 흐름·지금은 피해야 할 행동을 짚어 드려요.'),
  ('love', 'report', 'romance', '연애사주', '내 사랑은 언제 올까?', 13900, null, null, '내 명식에 새겨진 연애의 결과 자꾸 반복되는 패턴, 올해 인연이 들어오는 시기를 읽어 드려요.'),
  ('compatibility', 'report', 'chemistry', '궁합사주', '우리는 왜 같은 걸로 또 싸울까', 16800, null, null, '두 사람의 기운이 부딪히는 지점과 서로를 채우는 자리, 이 사람에게 실제로 닿는 말투를 찾아 드려요.'),
  ('destiny-full', 'report', 'destiny', '종합사주', '타고난 것부터 말년까지, 한 권으로', 48200, 72000, '33% OFF', '타고난 그릇에서 시작해 열 해씩 바뀌는 대운 아홉 칸, 올해와 내년, 재물과 인연, 말년까지 — 흩어져 있던 풀이를 한 사람의 생애 순서로 꿰어 읽는 열한 장입니다.'),
  ('life', 'report', 'destiny', '평생사주', '내 인생은 어떻게 흘러갈까?', 19800, null, null, '타고난 그릇의 모양과 중심이 되는 기운, 인생의 큰 물줄기가 바뀌는 전환점을 읽어 드려요.'),
  ('yearly', 'report', 'year', '신년사주', '내년엔 무슨 일이 생길까?', 14900, null, null, '한 해의 큰 흐름을 달 단위로 쪼개, 기회가 열리는 달과 한 템포 쉬어 갈 달을 나눠 드려요.'),
  ('money', 'report', 'wealth', '재물운 사주', '돈이 들어오는 길목과 새는 구멍', 9900, null, null, '돈이 들어오는 자리와 새어 나가는 구조, 재물의 흐름이 바뀌는 시기를 읽어 드려요.'),
  ('career', 'report', 'work', '직업운 사주', '나에게 맞는 일은 뭘까?', 9900, null, null, '타고난 기질로 읽는 일의 적성과, 지원·이직에 힘이 실리는 시기를 짚어 드려요.'),
  ('health', 'report', 'destiny', '건강사주', '내 몸이 먼저 지치는 자리', 9900, null, null, '기운의 치우침으로 읽는 몸의 긴장 자리와, 리듬을 고르게 되돌리는 생활 습관을 짚어 드려요.'),
  ('study', 'report', 'study', '학업사주', '나는 언제 공부가 터질까?', 12900, null, null, '내가 어떤 방식으로 공부해야 남는 사람인지, 시험과 자격증에 힘이 실리는 달은 언제인지 읽어 드려요.'),
  ('child-study', 'report', 'child', '우리 아이 공부사주', '이 아이에게 맞는 공부 방식', 14900, null, null, '아이의 명식으로 읽는 공부 체질과 집중이 붙는 방식, 부모가 건네면 좋은 말과 눌러서는 안 될 결을 짚어 드려요.'),
  ('parent-child', 'report', 'child', '부모·자녀 궁합사주', '우리 아이와 왜 자꾸 부딪힐까?', 14900, null, null, '부모와 아이의 기운이 부딪히는 지점과, 이 아이에게 실제로 닿는 말투를 찾아 드려요.'),
  ('business', 'report', 'work', '사업운 사주', '나는 사업을 해도 될까?', 16900, 24000, '29% OFF', '남 밑에서 버는 결인지 내 간판을 걸 결인지, 사람을 써야 크는지 혼자 해야 남는지 — 벌일 때와 접을 때까지 짚어 드려요.'),
  ('child-admission', 'report', 'child', '우리 아이 입시사주', '우리 아이가 갈 대학의 첫 글자', 19800, 29000, '31% OFF', '입시를 앞둔 아이의 학업 기운이 차오르는 해와 꺾이는 해를 연도별 표로 펼쳐, 고3·재수 시기의 흐름과 시험에 힘이 실리는 달을 짚어 드려요.'),
  ('child-dream', 'report', 'child', '우리 아이 진로사주', '이 아이는 무엇이 되려고 태어났을까', 16900, null, null, '타고난 재능이 어느 쪽으로 뻗는지, 어떤 일에서 빛나고 어떤 일에서 시드는지 — 아이가 스스로 길을 고를 때 참고할 결을 읽어 드려요.'),
  ('child-talent', 'report', 'child', '우리 아이 영재사주', '우리 아이는 어떤 재능이 있을까?', 14900, null, null, '아이의 명식에 드러난 재능의 종류와 그것이 터지는 시기, 그리고 지금 눌러서는 안 될 결을 짚어 드려요.'),
  ('consult', 'consult', 'destiny', '1:1 사주 상담', '궁금한 걸 직접 묻는 자리', 5900, null, null, '내 명식을 띄워 두고 궁금한 것을 자유롭게 묻는 대화 세션이에요 · 최대 20턴')
on conflict (slug) do update set
  kind = excluded.kind,
  category = excluded.category,
  title = excluded.title,
  tagline = excluded.tagline,
  price = excluded.price,
  original_price = excluded.original_price,
  discount_label = excluded.discount_label,
  description = excluded.description,
  is_active = true;
