-- scripts/generate-report-seed.mts 가 lib/reports/catalog.ts 에서 생성한 파일입니다. 직접 수정하지 마세요.
insert into public.reports (slug, kind, category, title, price, original_price, discount_label, description)
values
  ('reunion-deep', 'report', 'reunion', '월령의 밤 : 그 사람은 왜 연락을 멈췄을까?', 14900, 24000, '38% OFF', '헤어진 상대의 가려진 무의식과 마음의 빗장이 풀리는 결정적 타이밍, 그리고 내가 먼저 연락하면 안 되는 사주적 이유.'),
  ('reunion', 'report', 'reunion', '그 사람의 속마음과 재회 타이밍', 12900, null, null, '상대방의 현재 사주 대운 속 연애관, 연락이 닿을 가능성이 가장 높은 날짜와 금기 행동'),
  ('love', 'report', 'romance', '올해 나를 찾아올 결정적 인연의 얼굴과 장소', 13900, null, null, '내 사주 원국에 박힌 정관/편관의 기운으로 풀어낸 인연의 나이대, 외모 분위기, 첫 만남의 계기'),
  ('compatibility', 'report', 'chemistry', '사소한 말에 상처받는 이유 : 기운 충돌 처방전', 16800, null, null, '반복되는 싸움의 오행적 원인과 대화법, 서로의 결핍을 채워주는 현실적 조화의 길'),
  ('life', 'report', 'destiny', '타고난 그릇과 30대 후반 대운의 방향성', 19800, null, null, '내 사주의 중심 오행과 용신 분석, 인생의 가장 큰 물줄기가 바뀌는 황금기 전환점'),
  ('yearly', 'report', 'year', '다가오는 해, 나에게 머무는 한 글자', 14900, null, null, '세운과 월운으로 짚어 보는 한 해의 큰 흐름, 기회가 열리는 달과 한 템포 쉬어 갈 달'),
  ('money', 'report', 'wealth', '돈이 들어오는 길목과 새는 구멍', 9900, null, null, '재성의 구조와 재고(財庫)가 열리는 시기로 읽는 나만의 재물 흐름'),
  ('career', 'report', 'wealth', '나에게 맞는 일, 움직이기 좋은 때', 9900, null, null, '십성과 대운으로 보는 일의 적성, 지원·이직에 힘이 실리는 시기'),
  ('health', 'report', 'destiny', '내 몸의 기운이 기우는 방향', 9900, null, null, '오행 균형으로 살피는 유의 계통과 생활 속 기운 고르기'),
  ('study', 'report', 'study', '공부가 붙는 시기와 나에게 맞는 공부법', 12900, null, null, '인성·식상의 흐름으로 읽는 집중력의 결, 시험·자격증에 힘이 실리는 달과 흔들리기 쉬운 달'),
  ('child-study', 'report', 'study', '우리 아이가 빛나는 공부 방향과 진로의 결', 14900, null, null, '자녀의 명식으로 읽는 타고난 학습 기질과 재능, 공부에 힘이 붙는 시기, 부모가 건네면 좋은 말'),
  ('parent-child', 'report', 'study', '나와 아이, 부딪히는 이유와 가까워지는 말', 14900, null, null, '부모와 자녀의 오행이 서로를 채우고 부딪히는 지점, 잔소리 대신 닿는 대화법'),
  ('consult', 'consult', 'destiny', '서하와 나누는 1:1 사주 상담', 5900, null, null, '내 명식을 바탕으로 궁금한 것을 자유롭게 묻는 대화 세션 · 최대 20턴')
on conflict (slug) do update set
  kind = excluded.kind,
  category = excluded.category,
  title = excluded.title,
  price = excluded.price,
  original_price = excluded.original_price,
  discount_label = excluded.discount_label,
  description = excluded.description,
  is_active = true;
