// synchronizes events by queueing them(process each at a time)
export function createQueue() {
  let queue = [];
  let processing = false;

  let processNext = () => {
    if (processing || queue.length === 0) return; // if still processing wait or nothing to be processed stop
    const nextEvent = queue.shift();

    processing = true;
    nextEvent(() => {
      processing = false;
      processNext();
    });
  };

  let enQueue = (item) => {
    queue.push(item);
    if (typeof item == "function") {
      processNext();
    }
  };

  let dequeue = () => {
    return queue.shift();
  };

  let peek = () => {
    return queue[0];
  };

  let size = () => {
    return queue.length;
  };
  let isEmpty = () => {
    return queue.length === 0;
  };

  let remove = (item) => {
    queue = queue.filter((i) => i !== item);
  };

  return { enQueue, dequeue, peek, size, isEmpty, remove };
}
