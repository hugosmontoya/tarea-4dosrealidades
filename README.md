# Dos Realidades — Maquiavelo: La Máscara de la Felicidad

> *«Todos ven lo que aparentas ser, pero pocos ven lo que realmente eres.»*  
> — **Nicolás Maquiavelo**, *El Príncipe* (Cap. XVIII, 1532)

Ejercicio de visión artificial y representación para el curso **Dispositivos Periféricos y Programación Interactiva (DPPI)**.

* **Demo en vivo (GitHub Pages):** https://hugosmontoya.github.io/tarea-4dosrealidades/
* **Repositorio:** https://github.com/hugosmontoya/tarea-4dosrealidades

---

## De qué se trata

Frente a una misma cámara web ocurre una sola escena: el rostro humano. Sin embargo, dos sistemas computacionales construyen dos verdades opuestas en tiempo real, materializando la paradoja maquiavélica entre la máscara social y la verdad física despojada:

### Sistema A — «Lo que quieres que vean» (MediaPipe)
* **Tecnología:** MediaPipe Face Landmarker (`@mediapipe/tasks-vision`) con análisis de *blendshapes* faciales y WebAssembly.
* **Qué busca:** Reconoce la fisonomía del rostro y evalúa en vivo las microexpresiones de **sonrisa y felicidad proyectada** (`mouthSmileLeft`, `mouthSmileRight`).
* **Representación:** Traza una máscara geométrica estilizada en tonos dorados con resplandor luminoso sobre los contornos faciales (ojos, cejas, labios y óvalo). Al sonreír, la barra de emoción se llena e ilumina el rostro, premiando el gesto positivo. Es la consagración técnica del **simulacro social**: la máquina cree y valida la fachada que tú decides proyectar al mundo exterior.

### Sistema B — «Lo que realmente eres» (OpenCV.js)
* **Tecnología:** OpenCV.js (`@techstark/opencv-js`) con binarización adaptativa gaussiana (`cv.adaptiveThreshold`).
* **Qué busca:** Procesa la imagen a pantalla completa eliminando cualquier gradación de color o tonos grises: convierte la escena a **blanco o negro absoluto** (0 o 255).
* **Representación:** En este lienzo, **la emoción humana se desintegra**. La sonrisa desaparece y se quiebra en cavidades oscuras y bloques ásperos de luz y sombra. Ciega a la psicología del gesto, la máquina despoja al individuo de su artificio cosmético: ante la óptica física, solo somos un volumen de materia obstruyendo y reflejando fotones.

---

## Reflexión Filosófica

En el capítulo XVIII de *El Príncipe*, Nicolás Maquiavelo formula una de las observaciones más lúcidas sobre la condición humana: los hombres en general juzgan más por los ojos que por las manos, porque a todos les es dado ver, pero a muy pocos tocar y sentir lo que verdaderamente subyace. La vida en comunidad nos exige una constante diplomacia del semblante: proyectar serenidad, cordialidad y éxito; en definitiva, **mostrar a los demás lo que queremos que vean, y no lo que realmente somos**.

Frente a una misma lente, esta obra enfrenta dos sistemas de visión computacional que encarnan de manera radical esta dualidad:

**El Sistema A (MediaPipe) es la máquina de la apariencia social.** Dotado de un modelo de aprendizaje profundo entrenado con miles de rostros humanos, este algoritmo busca y recompensa la sonrisa. Identifica las comisuras de los labios, la contracción de los pómulos y la apertura de los párpados para cuantificar un porcentaje de «felicidad». El sistema dibuja una máscara luminosa, dorada y armónica que celebra el gesto positivo. Aunque por dentro la persona pueda estar atravesando dolor, tensión o incertidumbre, basta con forzar una leve curvatura en la boca para que el algoritmo certifique con entusiasmo que allí hay una persona «feliz». Es la consagración técnica del simulacro social: la máquina cree ciegamente en la fachada que tú decides proyectar.

**El Sistema B (OpenCV), en cambio, es la máquina del despojo ontológico.** Desprovisto de toda psicología y ajeno a los códigos sociales, este algoritmo convierte la escena a un contraste binario absoluto de blanco y negro puro. En esta pantalla, la sonrisa pierde todo su significado: las comisuras se quiebran en bloques de sombras ásperas, los ojos se hunden en cavidades oscuras y la piel se vuelve un mapa implacable de zonas iluminadas o ensombrecidas. Aquí no hay simpatía, no hay calidez ni hay felicidad reconocible. Solo queda la verdad física de la escena: eres un cuerpo biológico obstruyendo y reflejando fotones en el espacio.

Al contemplar ambas pantallas simultáneamente, se hace visible la paradoja que Maquiavelo vislumbró hace medio milenio: mientras todo el mundo se queda fascinado con la luz cálida de la sonrisa que mostramos en la primera pantalla, pocos son capaces de sostener la mirada sobre la segunda, donde somos simplemente luces y sombras luchando contra el vacío.

---

## Cómo probarlo localmente

1. Ejecuta el archivo `iniciar_servidor.bat` (haciendo doble clic en Windows), o levanta un servidor HTTP local desde la terminal:
   ```bash
   python -m http.server 8000
   ```
2. Abre en tu navegador [http://localhost:8000](http://localhost:8000).
3. Concede los permisos de cámara y haz clic en **«Activar Cámara»**.

---

## Tecnologías utilizadas

* **MediaPipe Tasks Vision (Google):** Face Landmarker & Face Blendshapes (WASM / GPU delegate).
* **OpenCV.js:** Procesamiento matricial de imágenes y binarización adaptativa en tiempo real.
* **HTML5 Canvas 2D & JavaScript Vanilla:** Renderizado fluido a 60 FPS sin frameworks externos.

---
Hugo Montoya · Ejercicio Dos Realidades — DPPI
