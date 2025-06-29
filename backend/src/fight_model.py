def calculate_exchange_probabilities(stats_A, stats_B, w_td=0.3, w_sub=0.2):
    """
    Given stats for Fighter A and Fighter B, compute exchange probabilities.

    Args:
        stats_A (dict): Stats for Fighter A
        stats_B (dict): Stats for Fighter B
        w_td (float): Weight for takedown effectiveness
        w_sub (float): Weight for submission average

    Returns:
        tuple: (P_A, P_B, P_neutral)
    """
    # Effective striking
    E_strike_A = stats_A["SLpM"] * stats_A["StrAcc"] * (1 - stats_B["StrDef"])
    E_strike_B = stats_B["SLpM"] * stats_B["StrAcc"] * (1 - stats_A["StrDef"])

    # Takedown effectiveness
    TD_eff_A = stats_A["TDAvg"] * stats_A["TDAcc"] * (1 - stats_B["TDDef"])
    TD_eff_B = stats_B["TDAvg"] * stats_B["TDAcc"] * (1 - stats_A["TDDef"])

    # Grappling effectiveness
    G_A = w_td * TD_eff_A + w_sub * stats_A["SubAvg"]
    G_B = w_td * TD_eff_B + w_sub * stats_B["SubAvg"]

    # Total effectiveness
    E_A = E_strike_A + G_A
    E_B = E_strike_B + G_B

    # Raw probabilities
    P_raw_A = E_A / (E_A + E_B)
    P_raw_B = E_B / (E_A + E_B)

    # Final probabilities with neutral component
    P_neutral = 0.4
    P_A = P_raw_A * 0.6
    P_B = P_raw_B * 0.6

    return P_A, P_B, P_neutral
