// Estimacion del porcentaje de grasa corporal a partir de los datos que ya se capturan en
// el registro del cliente: peso, altura, edad y sexo. No sustituye una medicion real con
// plicometro o bioimpedancia; es una estimacion para que el seguimiento arranque con un
// numero en vez de un guion, y siempre se puede sobrescribir a mano.
//
// Formula de Deurenberg (1991):
//   % grasa = (1.20 x IMC) + (0.23 x edad) - (10.8 x sexo) - 5.4
//   sexo = 1 hombre, 0 mujer
//
// Margen de error tipico +-4%. Sobreestima en personas muy musculadas (el IMC no distingue
// musculo de grasa), que es justo el perfil de un gimnasio: por eso se muestra como
// "estimada" y el entrenador puede reemplazarla.

const MIN_PERCENT = 3;
const MAX_PERCENT = 65;

export function estimateBodyFat({ weightKg, heightCm, age, gender }) {
  const weight = Number(weightKg);
  const height = Number(heightCm);
  const years = Number(age);

  // Sin cualquiera de los tres no hay formula posible. Los rangos descartan datos
  // imposibles (una altura de 15 cm, un peso de 5 kg) que darian un resultado absurdo.
  if (!(weight > 20 && weight < 400)) return null;
  if (!(height > 100 && height < 250)) return null;
  if (!(years > 0 && years < 120)) return null;

  const bmi = weight / (height / 100) ** 2;
  const isMale = gender !== "female";
  const percent = 1.2 * bmi + 0.23 * years - 10.8 * (isMale ? 1 : 0) - 5.4;

  if (!Number.isFinite(percent)) return null;

  // El recorte evita mostrar negativos o cifras imposibles cuando el IMC se sale de rango.
  const clamped = Math.min(Math.max(percent, MIN_PERCENT), MAX_PERCENT);
  return Math.round(clamped * 10) / 10;
}
