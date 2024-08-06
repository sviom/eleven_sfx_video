export async function mergeAndDownload(videoFile: File | null, audioData: string) {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();

    const load = async () => {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        ffmpeg.on('log', ({ message }) => {
            console.log(message);
        });
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    };
    const process = async () => {
        console.log('transcoding');
        if (!videoFile) {
            throw new Error('No video file');
        }

        if (videoFile) {
            await ffmpeg.writeFile('input.mp4', await fetchFile(URL.createObjectURL(videoFile)));
        }

        await ffmpeg.writeFile('audio.mpeg', await fetchFile(audioData));

        await ffmpeg.exec(['-v', 'error', '-i', 'input.mp4', '-f', 'null', '-']);

        await ffmpeg.exec(['-v', 'error', '-i', 'audio.mpeg', '-f', 'null', '-']);

        await ffmpeg.exec([
            '-i',
            'input.mp4',
            '-an', // This option removes the audio
            'no_audio.mp4',
        ]);

        await ffmpeg.exec([
            '-v',
            'verbose',
            '-i',
            'no_audio.mp4',
            '-i',
            'audio.mpeg',
            '-c:v',
            'copy', // Copy the video codec
            '-c:a',
            'aac', // Transcode audio to AAC
            '-strict',
            'experimental',
            'output.mp4',
        ]);
        console.log('transcoding completed');
        const data = (await ffmpeg.readFile('output.mp4')) as Uint8Array;
        const final_url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
        const downloadLinkFinalVideo = document.createElement('a');
        downloadLinkFinalVideo.href = final_url;
        downloadLinkFinalVideo.download = 'final_output.mp4';
        downloadLinkFinalVideo.click();
    };

    await load();
    await process();
}
