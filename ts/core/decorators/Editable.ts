/**
 * Marca un accesor como editable por el usuario.
 * El sanitizado real ocurre en el setter de cada bloque;
 * este decorador solo deja constancia del contrato.
 */
export function Editable(): MethodDecorator {
  return (_target, _key, descriptor) => descriptor;
}
