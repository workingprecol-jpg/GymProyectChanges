namespace GymSaaS.Application.DTOs.Members;

// Editar un cliente solo cambia sus datos basicos. La biometria (peso y perimetros) se
// actualiza unicamente registrando una medicion en Progreso, que ademas deja el historial:
// tenerla en dos sitios permitia sobrescribir una medida sin dejar rastro en la grafica.
// HeightCm si sigue aqui porque Progreso no la registra y no cambia con el entrenamiento.
public sealed record UpdateMemberRequest(
    string? FullName,
    string? Email,
    string? Phone,
    string? Gender,
    DateOnly? BirthDate,
    int? Age,
    decimal? HeightCm);
