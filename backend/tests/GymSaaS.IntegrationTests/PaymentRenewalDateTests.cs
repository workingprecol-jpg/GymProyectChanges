using System.Globalization;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Registering a payment also renews an expired membership. It used to renew from "today" while
/// happily storing whatever PaidAt it was given, so a receptionist catching up on last week's
/// paperwork silently handed out a week of extra membership — money the gym never charged for.
/// These pin the rule that replaced it: the new period is anchored on the day the money came in,
/// and it never starts before the day the old period ended.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class PaymentRenewalDateTests
{
    private const int PlanDays = 30;

    private readonly ApiFixture _fixture;

    public PaymentRenewalDateTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task A_backdated_payment_renews_from_the_payment_date_not_from_today()
    {
        using var gym = await _fixture.RegisterGymAsync("Fechas");
        var memberId = await ExpiredMemberAsync(gym, endedOn: Today.AddDays(-21));

        // The member paid a fortnight ago; reception is only entering it now.
        var paidOn = Today.AddDays(-14);
        await RegisterPaymentAsync(gym, memberId, paidOn);

        // Renewing from today would have run to today+30: fourteen days of membership nobody paid for.
        Assert.Equal(paidOn.AddDays(PlanDays), await EndDateAsync(gym, memberId));
    }

    [Fact]
    public async Task A_payment_entered_the_same_day_still_renews_from_today()
    {
        using var gym = await _fixture.RegisterGymAsync("Fechas");
        var memberId = await ExpiredMemberAsync(gym, endedOn: Today.AddDays(-3));

        await RegisterPaymentAsync(gym, memberId, Today);

        // The ordinary case — payment entered the day it is received — must be untouched by the fix.
        Assert.Equal(Today.AddDays(PlanDays), await EndDateAsync(gym, memberId));
    }

    [Fact]
    public async Task A_payment_older_than_the_expiry_stacks_on_the_old_end_date()
    {
        using var gym = await _fixture.RegisterGymAsync("Fechas");
        var endedOn = Today.AddDays(-10);
        var memberId = await ExpiredMemberAsync(gym, endedOn);

        // Paid while the membership was still running, registered only after it lapsed.
        await RegisterPaymentAsync(gym, memberId, paidOn: Today.AddDays(-20));

        // Anchoring on the payment date alone would end the new period at today-20+30 = today+10,
        // swallowing the ten days the member had already paid for. It stacks instead.
        Assert.Equal(endedOn.AddDays(PlanDays), await EndDateAsync(gym, memberId));
    }

    private static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);

    /// <summary>A member whose membership ran out on the given day.</summary>
    private static async Task<Guid> ExpiredMemberAsync(GymSession gym, DateOnly endedOn)
    {
        await gym.CreatePlanAsync("Mensual", price: 80_000m, durationDays: PlanDays);
        var memberId = await gym.CreateMemberAsync("Cira Atrasada", "Mensual", 80_000m);

        await gym.PutAsync($"/api/members/{memberId}/membership", new
        {
            startDate = endedOn.AddDays(-PlanDays),
            endDate = endedOn,
            planName = "Mensual"
        });

        return memberId;
    }

    private static Task RegisterPaymentAsync(GymSession gym, Guid memberId, DateOnly paidOn) =>
        gym.PostAsync("/api/finance/payments", new
        {
            memberId,
            amount = 80_000m,
            paymentMethod = "Efectivo",
            paidAt = paidOn
        });

    private static async Task<DateOnly> EndDateAsync(GymSession gym, Guid memberId)
    {
        var members = await gym.GetAsync("/api/members");
        var member = members.EnumerateArray().Single(item => item.GetGuid("memberId") == memberId);

        return DateOnly.ParseExact(
            member.GetProperty("endDate").GetString()!,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture);
    }
}
