import {beforeEach,describe,expect,it,vi} from "vitest";
import {GET} from "@/app/api/readings/[id]/sales/route";
const mock=vi.hoisted(()=>({user:vi.fn(),reading:vi.fn()}));
vi.mock("@/lib/auth/session",()=>({getCurrentUser:mock.user}));
vi.mock("@/lib/db",()=>({getRepository:()=>({getReading:mock.reading})}));
const profile={name:"가상검증",birthYear:1990,birthMonth:1,birthDay:1,birthHour:12,birthMinute:0,isFemale:true,isLunar:false,birthCity:"서울"};
describe("입력한 사주에 따른 구입 유도",()=>{
 beforeEach(()=>{vi.clearAllMocks();mock.user.mockResolvedValue({id:"buyer"});});
 it("다른 생일은 다른 원국·개인화 자료를 반환하며 귀인 계산을 포함한다",async()=>{
  const read=async(birthYear:number)=>{
   mock.reading.mockResolvedValue({userId:"buyer",reportSlug:"factbomb",subject:{...profile,birthYear},partner:null,answers:{}});
   const response=await GET(new Request("https://example.test"),{params:{id:"input"}});
   expect(response.status).toBe(200);return response.json();
  };
  const a=await read(1990),b=await read(1991);
  expect(a.context.pillars).not.toEqual(b.context.pillars);
  expect(a.context.focus.benefactor).toBeDefined();
  expect(a.chart.name).toBe(profile.name);
  expect(a.narrative.personality.body.length).toBeGreaterThan(0);
 });
 it("다른 고객의 사주는 반환하지 않는다",async()=>{
  mock.reading.mockResolvedValue({userId:"other"});
  expect((await GET(new Request("https://example.test"),{params:{id:"input"}})).status).toBe(404);
 });
});
