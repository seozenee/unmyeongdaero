import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/readings/[id]/sales/route";
import {listReports} from "@/lib/reports/catalog";
import {SALES_FOCUS,salesFocusFor} from "@/lib/reports/sales-focus";
import {lockedTopicsFor} from "@/lib/reports/preview-topics";
const repo=vi.hoisted(()=>({reading:vi.fn()}));
vi.mock("@/lib/auth/session",()=>({getCurrentUser:async()=>({id:"buyer"})}));
vi.mock("@/lib/db",()=>({getRepository:()=>({getReading:repo.reading})}));
const adult={name:"가상검증",birthYear:1990,birthMonth:4,birthDay:12,birthHour:9,birthMinute:30,isFemale:true,isLunar:false,birthCity:"서울"};
describe("모든 사주 상품의 개인화 유도",()=>{
 beforeEach(()=>vi.clearAllMocks());
 for(const product of listReports())it(`${product.slug}: 상품별 질문·실천·주의점과 실제 사주 자료를 제공한다`,async()=>{
  const subject=product.roles?.subject==="child"?{...adult,birthYear:2012}:adult;
  const partner=product.partner==="required"?{...adult,name:"가상상대",birthYear:product.slug==="parent-child"?2012:1989}:null;
  repo.reading.mockResolvedValue({userId:"buyer",reportSlug:product.slug,subject,partner,answers:{}});
  const response=await GET(new Request("https://example.test"),{params:{id:"test"}});
  expect(response.status).toBe(200);
  const data=await response.json();
  const focus=salesFocusFor(data.context,data.narrative);
  expect(SALES_FOCUS[product.slug]).toBeDefined();
  expect(new Set(focus.questions).size).toBe(3);
  expect(focus.action.length).toBeGreaterThan(15);
  expect(focus.caution.length).toBeGreaterThan(15);
  expect(focus.facts.length).toBeGreaterThan(0);
  expect(data.context.months).toHaveLength(12);
  expect(data.context.partnerName).toBe(partner?.name??null);
  expect(data.context.pillars.day.full).toBeTruthy();
  if(focus.benefactor)expect(focus.benefactor.year*100+(focus.benefactor.month??12)).toBeGreaterThanOrEqual(Number(data.context.today.slice(0,4))*100+Number(data.context.today.slice(5,7)));
 });
 it("미성년자의 신년·재물·건강 상품도 상품 고유의 질문을 유지한다",async()=>{
  for(const slug of ["yearly","money","health"]){
   repo.reading.mockResolvedValue({userId:"buyer",reportSlug:slug,subject:{...adult,birthYear:2012},partner:null,answers:{}});
   const data=await (await GET(new Request("https://example.test"),{params:{id:"test"}})).json();
   expect(lockedTopicsFor(data.context)[0]!.title).toBe(slug==="yearly"?"앞으로의 시기와 선택":slug==="money"?"돈이 들어오는 길과 남는 조건":"몸과 마음을 덜 소모하는 생활");
  }
 });
});
