export default <T>(arr: T[], size: number) => {
    let chunks: T[][] = [];

    for (let i = 0; i < arr.length; i += size)
        chunks.push(arr.slice(i, i + size));
    
    return chunks;
}