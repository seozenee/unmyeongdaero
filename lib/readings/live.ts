import "server-only";

// 진행 중인 이야기 생성의 텍스트 조각을 보관하는 프로세스 내 버퍼.
// 생성 작업은 요청과 분리돼 끝까지 돌고(결과는 DB 저장), 접속한 클라이언트는 여기서 스트림을 이어 받는다.
// 다른 인스턴스에서 들어온 요청은 버퍼가 없으므로 상태 폴링으로 전환한다.

interface LiveGeneration {
  chunks: string[];
  done: boolean;
  error: string | null;
  listeners: Set<() => void>;
}

const registry = ((globalThis as { __sazudaeroLive?: Map<string, LiveGeneration> }).__sazudaeroLive ??= new Map());

export function startLive(id: string) {
  const live: LiveGeneration = { chunks: [], done: false, error: null, listeners: new Set() };
  registry.set(id, live);

  const notify = () => live.listeners.forEach((listener) => listener());
  const finish = (error: string | null) => {
    live.done = true;
    live.error = error;
    notify();
    setTimeout(() => registry.delete(id), 60_000);
  };

  return {
    push(delta: string) {
      live.chunks.push(delta);
      notify();
    },
    succeed: () => finish(null),
    fail: (message: string) => finish(message),
  };
}

export function hasLive(id: string) {
  return registry.has(id);
}

/** 지금까지의 조각을 재생한 뒤 새 조각을 이어서 흘려보내는 스트림 */
export function streamLive(id: string): ReadableStream<Uint8Array> | null {
  const live = registry.get(id);
  if (!live) return null;
  const encoder = new TextEncoder();
  let cursor = 0;
  let listener: (() => void) | null = null;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const flush = () => {
        while (cursor < live.chunks.length) controller.enqueue(encoder.encode(live.chunks[cursor++]!));
        if (live.done) {
          if (listener) live.listeners.delete(listener);
          controller.close();
        }
      };
      listener = flush;
      live.listeners.add(listener);
      flush();
    },
    cancel() {
      if (listener) live.listeners.delete(listener);
    },
  });
}
