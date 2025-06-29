def calculate_exchange_probabilities(stats_A, stats_B):
    # Effective striking
    E_strike_A = stats_A.slpm * stats_A.str_acc * (1 - stats_B.str_def)
    E_strike_B = stats_B.slpm * stats_B.str_acc * (1 - stats_A.str_def)

    # Grappling (takedowns and submissions)
    TD_A = stats_A.td_avg * stats_A.td_acc * (1 - stats_B.td_def)
    TD_B = stats_B.td_avg * stats_B.td_acc * (1 - stats_A.td_def)
    Sub_A = stats_A.sub_avg
    Sub_B = stats_B.sub_avg

    G_A = 0.3 * TD_A + 0.2 * Sub_A
    G_B = 0.3 * TD_B + 0.2 * Sub_B

    E_A = E_strike_A + G_A
    E_B = E_strike_B + G_B

    P_raw_A = E_A / (E_A + E_B)
    P_raw_B = E_B / (E_A + E_B)

    P_neutral = 0.4
    P_A = P_raw_A * 0.6
    P_B = P_raw_B * 0.6

    return P_A, P_B, P_neutral
