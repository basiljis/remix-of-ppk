// Game item images mapping
import apple from "./apple.png";
import pear from "./pear.png";
import car from "./car.png";
import banana from "./banana.png";
import orange from "./orange.png";
import ball from "./ball.png";
import cat from "./cat.png";
import dog from "./dog.png";

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
  
  // Animals
  "кошка": cat,
  "кот": cat,
  "собака": dog,
  "пёс": dog,
};

export { apple, pear, car, banana, orange, ball, cat, dog };
