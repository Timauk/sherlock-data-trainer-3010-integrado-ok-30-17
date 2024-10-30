export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanedData?: number[][];
}

export const validateData = (numbers: number[][]): ValidationResult => {
  const errors: string[] = [];
  let isValid = true;

  // Validate data structure
  if (!Array.isArray(numbers)) {
    errors.push("Data must be an array");
    return { isValid: false, errors };
  }

  // Clean and validate each game
  const cleanedData = numbers.filter((game, index) => {
    if (!Array.isArray(game)) {
      errors.push(`Game ${index} must be an array`);
      isValid = false;
      return false;
    }

    if (game.length !== 15) {
      errors.push(`Game ${index} must have exactly 15 numbers`);
      isValid = false;
      return false;
    }

    // Check for valid numbers (1-25)
    const validNumbers = game.every(num => num >= 1 && num <= 25 && Number.isInteger(num));
    if (!validNumbers) {
      errors.push(`Game ${index} contains invalid numbers`);
      isValid = false;
      return false;
    }

    // Check for duplicates
    const uniqueNumbers = new Set(game);
    if (uniqueNumbers.size !== game.length) {
      errors.push(`Game ${index} contains duplicate numbers`);
      isValid = false;
      return false;
    }

    return true;
  });

  return {
    isValid,
    errors,
    cleanedData: isValid ? cleanedData : undefined
  };
};