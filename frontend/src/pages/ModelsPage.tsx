import { Link } from "react-router-dom";
import { InlineMath } from "react-katex";
import { useState } from "react";
import "katex/dist/katex.min.css";
import ModelCard from "../components/ModelCard";
import FeatureGrid from "../components/FeatureGrid";
import InfoBox from "../components/InfoBox";
import MathFormula from "../components/MathFormula";
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import StraightenIcon from '@mui/icons-material/Straighten';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CasinoIcon from '@mui/icons-material/Casino';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import BuildIcon from '@mui/icons-material/Build';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function ModelPage() {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const toggleModel = (modelId: string) => {
    setExpandedModel(expandedModel === modelId ? null : modelId);
  };

  const mlFeatures = [
    {
      title: "Striking Metrics",
      icon: <SportsMmaIcon sx={{ fontSize: 20 }} />,
      items: [
        "Strikes Landed per Minute (SLpM)",
        "Striking Accuracy (%)",
        "Striking Defense (%)",
        "Significant Strike Differential"
      ]
    },
    {
      title: "Grappling Metrics", 
      icon: <SportsKabaddiIcon sx={{ fontSize: 20 }} />,
      items: [
        "Takedown Average per 15 min",
        "Takedown Accuracy (%)",
        "Takedown Defense (%)",
        "Submission Attempts per 15 min"
      ]
    },
    {
      title: "Physical Attributes",
      icon: <StraightenIcon sx={{ fontSize: 20 }} />, 
      items: [
        "Height (inches)",
        "Weight (pounds)",
        "Reach (inches)",
        "Age (years)"
      ]
    },
    {
      title: "Performance History",
      icon: <EmojiEventsIcon sx={{ fontSize: 20 }} />,
      items: [
        "Win/Loss Record",
        "Recent Form",
        "Opponent Quality", 
        "Fight Outcome Patterns"
      ]
    }
  ];

  const ensembleFeatures = [
    {
      title: "Machine Learning (60%)",
      icon: <SmartToyIcon sx={{ fontSize: 20 }} />,
      items: [
        "Higher weight due to historical data learning",
        "Captures complex non-linear patterns",
        "Adapts to fighter-specific tendencies",
        "Better at identifying statistical advantages"
      ]
    },
    {
      title: "Simulation (40%)",
      icon: <CasinoIcon sx={{ fontSize: 20 }} />, 
      items: [
        "Provides fight-by-fight variability",
        "Models round-by-round dynamics",
        "Accounts for probabilistic outcomes",
        "Offers interpretable exchange probabilities"
      ]
    }
  ];
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans relative overflow-hidden px-4 sm:px-6 py-16">
      {/* Background glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-5 dark:opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-5 dark:opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-10 tracking-tight">
          How the Prediction Models Work
        </h1>        <section className="bg-white/90 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow space-y-6 leading-relaxed text-gray-700 dark:text-gray-100 text-base">
          <p>
            The <strong className="text-gray-900 dark:text-white">MMA Math simulator</strong> offers three different prediction models to forecast UFC fight outcomes.
          All models use real-world fighter statistics scraped from UFCStats.com to make their predictions.
        </p>

        <h2 className="text-2xl font-bold mt-8 text-red-400">Prediction Models Overview</h2>
        <div className="space-y-4 mt-4">
            <ModelCard
              id="ensemble"
              title="Ensemble Model (Default)"
              description="Combines all available prediction methods for the most accurate results. Uses weighted averages of simulation and machine learning predictions."
              icon={<GpsFixedIcon sx={{ fontSize: 20 }} />}
              isExpanded={expandedModel === 'ensemble'}
              onToggle={toggleModel}
            >
              <p>The ensemble model combines predictions using a <span className="text-red-400 font-medium">weighted averaging approach</span> to leverage the strengths of different methodologies:</p>

              <h4 className="text-lg font-semibold text-red-300">Weighting Strategy</h4>
              <MathFormula 
                formula="P_{\text{ensemble}} = 0.6 \cdot P_{\text{ML}} + 0.4 \cdot P_{\text{sim}}"
                description="The ensemble uses the following weight distribution:"
              />
              
              <FeatureGrid features={ensembleFeatures} />

              <h4 className="text-lg font-semibold text-red-300">Why This Weighting?</h4>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li><strong>ML Dominance (60%):</strong> Historical data patterns are strong predictors</li>
                <li><strong>Simulation Balance (40%):</strong> Adds realistic fight variability</li>
                <li><strong>Consensus Approach:</strong> Reduces individual model weaknesses</li>
                <li><strong>Empirical Testing:</strong> 60/40 split showed best validation accuracy</li>
              </ul>

              <InfoBox title="Future Enhancement" icon={<BuildIcon sx={{ fontSize: 16 }} />} variant="warning">
                <p>
                  Future versions will implement <strong>confidence-based weighting</strong> where model weights 
                  adjust based on data quality and prediction confidence for each specific fighter matchup.
                </p>
              </InfoBox>
            </ModelCard>

            <ModelCard
              id="ml"
              title="Machine Learning Model"
              description="Uses a trained ML model that learns patterns from historical fight data to predict outcomes based on fighter statistics."
              icon={<SmartToyIcon sx={{ fontSize: 20 }} />}
              isExpanded={expandedModel === 'ml'}
              onToggle={toggleModel}
            >
              <p>The ML model uses a <span className="text-red-400 font-medium">Random Forest Classifier</span> trained on historical UFC fight data with the following configuration:</p>

              <h4 className="text-lg font-semibold text-red-300">Model Architecture</h4>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li><strong>Algorithm:</strong> Random Forest with 200 decision trees</li>
                <li><strong>Max Depth:</strong> 10 levels per tree</li>
                <li><strong>Class Weighting:</strong> Balanced to handle uneven win/loss distributions</li>
                <li><strong>Random State:</strong> 42 for reproducible results</li>
              </ul>

              <h4 className="text-lg font-semibold text-red-300">Feature Set</h4>
              <p className="text-sm">The model analyzes <strong>26 key features</strong> for each fighter matchup:</p>
              <FeatureGrid features={mlFeatures} />

              <h4 className="text-lg font-semibold text-red-300">Data Processing</h4>
              <MathFormula 
                formula="\text{Feature}_{\text{diff}} = \text{Fighter}_A - \text{Fighter}_B"
                description="Each fighter's data is processed through comparative analysis:"
              />
              <p className="text-sm">
                The model learns from <strong>differential patterns</strong> rather than absolute values, 
                making it more effective at identifying advantages between fighters.
              </p>
            </ModelCard>

            <ModelCard
              id="simulation"
              title="Simulation Model"
              description="Uses a biased random walk model to simulate individual rounds and exchanges, providing detailed fight breakdowns."
              icon={<CasinoIcon sx={{ fontSize: 20 }} />}
              isExpanded={expandedModel === 'simulation'}
              onToggle={toggleModel}
            >
              <p>The simulation model uses a <span className="text-red-400 font-medium">biased random walk</span> approach to model individual fight rounds:</p>

              <h4 className="text-lg font-semibold text-red-300">1. Exchange Probabilities</h4>
              <p className="text-sm">Each exchange can result in:</p>
              <ul className="list-disc ml-6 text-sm">
                <li>Fighter A wins</li>
                <li>Fighter B wins</li>
                <li>Neutral exchange</li>
              </ul>

              <MathFormula 
                formula="P_A + P_B + P_{\text{neutral}} = 1"
                description="These must add to 1:"
              />
              <p className="text-sm">
                We assume a fixed <InlineMath math="P_{\text{neutral}} = 0.4" /> to account for randomness.
                The remaining 60% is split based on fighter effectiveness:
              </p>
              <MathFormula formula="P_A = 0.6 \cdot \frac{E_A}{E_A + E_B}, \quad P_B = 0.6 \cdot \frac{E_B}{E_A + E_B}" />

              <h4 className="text-lg font-semibold text-red-300">2. Striking Effectiveness</h4>
              <MathFormula 
                formula="S = \text{SLpM} \cdot \text{Str Acc} \cdot (1 + \text{Opp SD})"
                description="Based on significant strikes, accuracy, and opponent defense:"
              />

              <h4 className="text-lg font-semibold text-red-300">3. Grappling Effectiveness</h4>
              <p className="text-sm">Grappling considers takedowns and submissions:</p>
              <MathFormula formula="T = \text{TD Avg} \cdot \text{TD Acc} \cdot (1 + \text{Opp TDD})" />
              <MathFormula formula="G = 0.3 \cdot T + 0.2 \cdot \text{Sub Avg}" />

              <h4 className="text-lg font-semibold text-red-300">4. Total Effectiveness</h4>
              <MathFormula formula="E = S + G" />

              <h4 className="text-lg font-semibold text-red-300">5. Round and Fight Scoring</h4>
              <p className="text-sm">Each round consists of 10 exchanges. Scoring logic:</p>
              <ul className="list-disc ml-6 text-sm">
                <li>Round winner: 10 points</li>
                <li>Round loser: 9 points</li>
                <li>Draw: 10–10</li>
              </ul>
              <p className="text-sm">
                The fighter with the most points after 5 rounds wins. Tied score means a draw.
              </p>
            </ModelCard>
          </div>

          <h2 className="text-2xl font-bold mt-8 text-red-400 flex items-center gap-2">
            <WarningAmberIcon sx={{ fontSize: 28 }} />
            Current Limitations
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Simulation model doesn't account for early stoppages (KOs/submissions)</li>
            <li>No momentum or fatigue modeling between rounds</li>
            <li>Judging criteria like damage or aggression not fully considered</li>
            <li>Fighter database is continuously being updated - not all fighters may be available</li>
            <li>Models are based on historical data and may not reflect recent performance changes</li>
          </ul>

          <InfoBox title="How to Use" icon={<LightbulbIcon sx={{ fontSize: 16 }} />} variant="info">
            <p>
              Choose your preferred prediction model on the simulation pages. The <strong>Ensemble</strong> model 
              is recommended for most accurate results, while the <strong>Simulation</strong> model provides 
              detailed exchange probabilities and round-by-round breakdowns.
            </p>
          </InfoBox>

        <div className="text-center mt-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/custom"
              className="text-red-400 hover:underline font-medium text-base"
            >
              Try Custom Simulation →
            </Link>
            <Link
              to="/events"
              className="text-red-400 hover:underline font-medium text-base"
            >
              Simulate UFC Events →
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
