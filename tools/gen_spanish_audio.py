"""
Placeholder Spanish audio for the sample course, using Piper (neural TTS) rather than espeak.

This exists because the sample course needs *some* audio, not because the platform does text-to-speech:
the format has no TTS at all, and a real language course ships recordings of a human being. The voice
model (es-carlfm-x-low) is trained on a public-domain dataset; the clips are credited in the manifest.

    pip install piper-tts
    curl -L -o voice.tar.gz https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-es-carlfm-x-low.tar.gz
    python3 gen_spanish_audio.py <voice.onnx> <out-dir>
"""
import subprocess, sys, wave
from pathlib import Path
from piper import PiperVoice
from piper.config import SynthesisConfig

CLIPS = {
    "hola": "Hola.", "buenos-dias": "Buenos días.", "buenas-tardes": "Buenas tardes.", "buenas-noches": "Buenas noches.",
    "adios": "Adiós.", "hasta-luego": "Hasta luego.", "gracias": "Gracias.", "de-nada": "De nada.", "por-favor": "Por favor.",
    "como-estas": "¿Cómo estás?", "muy-bien": "Muy bien, gracias.",
    "cafe": "un café", "cafe-con-leche": "un café con leche", "te": "un té", "agua": "un agua",
    "cerveza": "una cerveza", "zumo": "un zumo de naranja", "tostada": "una tostada", "croissant": "un cruasán",
    "la-cuenta": "la cuenta, por favor",
    "dictado-1": "Un café con leche, por favor.", "dictado-2": "La cuenta, por favor.", "dictado-3": "Buenos días, ¿qué desea?",
    "dialogo-1": "Buenos días, ¿qué desea? Hola. Un café con leche y una tostada, por favor. "
                 "¿Algo más? No, gracias. ¿Cuánto es? Son tres euros con cincuenta.",
    "dialogo-2": "Buenas tardes. ¿Tienen zumo de naranja? Sí, claro. ¿Grande o pequeño? "
                 "Pequeño, por favor. Y un cruasán. Muy bien. Son cuatro euros con veinte.",
    "uno": "uno", "dos": "dos", "tres": "tres", "cuatro": "cuatro", "cinco": "cinco",
    "seis": "seis", "siete": "siete", "ocho": "ocho", "nueve": "nueve", "diez": "diez",
    "precio-1": "Son dos euros con ochenta.", "precio-2": "Son cinco euros con diez.", "precio-3": "Son siete euros con cincuenta.",
    "modelo-pedir": "Hola. Un café con leche y un cruasán, por favor.", "modelo-cuenta": "La cuenta, por favor. Gracias.",
}

def main(model: str, out_dir: str) -> None:
    voice = PiperVoice.load(model)
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    # The model is already unhurried; slowing it further made single words drawl.
    cfg = SynthesisConfig(length_scale=1.0, noise_scale=0.667, noise_w_scale=0.8)
    for name, text in CLIPS.items():
        wav = f"/tmp/{name}.wav"
        with wave.open(wav, "wb") as w:
            voice.synthesize_wav(text, w, syn_config=cfg)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav,
                        "-af", "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,"
                               "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,"
                               "loudnorm=I=-18:TP=-2",
                        "-ar", "22050", "-c:a", "libmp3lame", "-q:a", "6", str(out / f"{name}.mp3")], check=True)
    print(f"{len(CLIPS)} clips → {out}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
