// Game item images mapping
import apple from "./apple.png";
import pear from "./pear.png";
import car from "./car.png";
import banana from "./banana.png";
import orange from "./orange.png";
import ball from "./ball.png";
import cat from "./cat.png";
import dog from "./dog.png";
import fingers from "./fingers.png";
import puzzle from "./puzzle.png";
import scissors from "./scissors.png";
import breathing from "./breathing.png";
import emotions from "./emotions.png";
import articulation from "./articulation.png";
import social from "./social.png";
import shop from "./shop.png";
import logic from "./logic.png";
import memory from "./memory.png";
import family from "./family.png";
import speech from "./speech.png";
import cognitive from "./cognitive.png";
import motor from "./motor.png";
import heart from "./heart.png";
import book from "./book.png";

// New task-specific images
import threeFruits from "./three-fruits.png";
import happyFace from "./happy-face.png";
import sadFace from "./sad-face.png";
import colorSequence from "./color-sequence.png";
import butterflyHands from "./butterfly-hands.png";
import calmBreathing from "./calm-breathing.png";
import tongueExercise from "./tongue-exercise.png";
import greeting from "./greeting.png";

// Additional item images
import bookItem from "./book-item.png";
import spoon from "./spoon.png";
import comb from "./comb.png";
import pencil from "./pencil.png";

// Map text options to images for quiz questions
export const gameItemImages: Record<string, string> = {
  // Fruits
  "яблоко": apple,
  "груша": pear,
  "банан": banana,
  "апельсин": orange,
  
  // Transport
  "машина": car,
  
  // Toys
  "мяч": ball,
  "мячик": ball,
  "пазл": puzzle,
  
  // Animals
  "кошка": cat,
  "кот": cat,
  "собака": dog,
  "пёс": dog,
  
  // Body parts
  "пальчики": fingers,
  "пальцы": fingers,
  "рука": fingers,
  
  // Activities & Objects
  "ножницы": scissors,
  "дыхание": breathing,
  "эмоции": emotions,
  "артикуляция": articulation,
  "общение": social,
  "магазин": shop,
  "логика": logic,
  "память": memory,
  "семья": family,
  "речь": speech,
  
  // New items
  "книга": bookItem,
  "книжка": bookItem,
  "ложка": spoon,
  "ложечка": spoon,
  "расчёска": comb,
  "расческа": comb,
  "карандаш": pencil,
  "карандашом": pencil,
  
  // Numbers (for counting tasks)
  "2": undefined as any,
  "3": threeFruits,
  "4": undefined as any,
  "5": undefined as any,
};

// Sphere images for blocks and materials
export const sphereImages: Record<string, string> = {
  "cognitive": cognitive,
  "motor": motor,
  "speech": speech,
  "social": social,
  "emotional": heart,
};

// Material type images
export const materialImages: Record<string, string> = {
  "article": book,
  "exercise": motor,
  "video": speech,
};

// Task-specific images for instructions/illustrations
export const taskImages: Record<string, string> = {
  // Counting tasks
  "count_fruits": threeFruits,
  "three_fruits": threeFruits,
  
  // Emotions
  "happy": happyFace,
  "sad": sadFace,
  "радость": happyFace,
  "грусть": sadFace,
  
  // Memory games
  "color_memory": colorSequence,
  "memory_colors": colorSequence,
  
  // Motor exercises
  "butterfly": butterflyHands,
  "бабочка": butterflyHands,
  
  // Breathing
  "breathing_calm": calmBreathing,
  "дыши": calmBreathing,
  
  // Speech
  "tongue": tongueExercise,
  "язычок": tongueExercise,
  
  // Social
  "hello": greeting,
  "greeting": greeting,
  "привет": greeting,
};

// Export all images individually
export { 
  apple, pear, car, banana, orange, ball, cat, dog,
  fingers, puzzle, scissors, breathing, emotions, articulation,
  social, shop, logic, memory, family, speech, cognitive, motor,
  heart, book,
  // New images
  threeFruits, happyFace, sadFace, colorSequence, 
  butterflyHands, calmBreathing, tongueExercise, greeting,
  bookItem, spoon, comb, pencil
};
