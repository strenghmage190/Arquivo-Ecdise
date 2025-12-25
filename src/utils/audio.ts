export async function playAudio(url: string) {
  const a = new Audio(url);
  await a.play();
}
