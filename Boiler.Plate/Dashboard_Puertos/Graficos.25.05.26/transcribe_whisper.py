import whisper
import sys
import os

def transcribe_with_whisper(audio_path):
    if not os.path.exists(audio_path):
        print(f"❌ Error: Archivo no encontrado: {audio_path}")
        return

    print(f"🔄 Cargando modelo Whisper (base)...")
    model = whisper.load_model("base")
    
    print(f"🎙️ Transcribiendo: {audio_path}")
    result = model.transcribe(audio_path)
    
    print("\n✅ Transcripción completada:\n")
    print("="*50)
    print(result["text"])
    print("="*50)
    
    output_file = audio_path + "_whisper.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(result["text"])
    print(f"\n💾 Guardado en: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        transcribe_with_whisper(sys.argv[1])
    else:
        print("Uso: python transcribe_whisper.py <archivo_audio>")
