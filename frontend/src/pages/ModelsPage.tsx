import { Link } from "react-router-dom";
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
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ModelPage() {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const toggleModel = (modelId: string) => {
    setExpandedModel(expandedModel === modelId ? null : modelId);
  };

  const mlFeatures = [
    {
      title: "Enhanced Striking Metrics",
      icon: <SportsMmaIcon sx={{ fontSize: 20 }} />,
      items: [
        "Strikes Landed per Minute (SLpM)",
        "Striking Accuracy (%)",
        "Striking Defense (%)", 
        "Striking Effectiveness Ratios",
        "Combined Striking Score"
      ]
    },
    {
      title: "Advanced Grappling Metrics", 
      icon: <SportsKabaddiIcon sx={{ fontSize: 20 }} />,
      items: [
        "Takedown Average per 15 min",
        "Takedown Accuracy (%)",
        "Takedown Defense (%)",
        "Submission Attempts per 15 min",
        "Grappling Effectiveness Ratios",
        "Combined Grappling Score"
      ]
    },
    {
      title: "Physical Advantages",
      icon: <StraightenIcon sx={{ fontSize: 20 }} />, 
      items: [
        "Height Difference (inches)",
        "Weight Difference (pounds)",
        "Reach Difference (inches)",
        "Age Difference (years)",
        "Binary Advantage Flags (Reach/Height/Weight/Age)"
      ]
    },
    {
      title: "Enhanced Feature Engineering",
      icon: <EmojiEventsIcon sx={{ fontSize: 20 }} />,
      items: [
        "Performance Ratio Calculations",
        "Physical Mismatch Penalties",
        "Cross-Feature Interactions",
        "Combined Effectiveness Metrics"
      ]
    }
  ];

  const ensembleFeatures = [
    {
      title: "Machine Learning (Base 60%)",
      icon: <SmartToyIcon sx={{ fontSize: 20 }} />,
      items: [
        "Enhanced with 41 advanced features",
        "Confidence-weighted predictions",
        "Advanced ratio and interaction features", 
        "Physical mismatch penalty system",
        "Improved cross-validation: 60.8% accuracy"
      ]
    },
    {
      title: "Enhanced Simulation (Base 40%)",
      icon: <CasinoIcon sx={{ fontSize: 20 }} />, 
      items: [
        "Dynamic fatigue modeling (5% per round)",
        "Momentum system (±30% performance swings)",
        "Round-by-round probability adjustments",
        "Realistic fight progression modeling",
        "Normalized probability distributions"
      ]
    },
    {
      title: "Confidence-Weighted Combination",
      icon: <GpsFixedIcon sx={{ fontSize: 20 }} />,
      items: [
        "Models weighted by prediction confidence",
        "Distance from neutral (50%) determines confidence",
        "Base weights adjusted by model certainty",
        "Fallback to neutral if both models uncertain",
        "Intelligent ensemble logic (fixed from 41.7%)"
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
          All models use real-world fighter statistics scraped from UFCStats.com and have been significantly enhanced with advanced features and improved logic.
        </p>

        <InfoBox title="July 2025 Major Updates" icon={<BuildIcon sx={{ fontSize: 16 }} />} variant="success">
          <p>
            <strong><RocketLaunchIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />Performance Boost:</strong> Enhanced ML features (18→41), fixed ensemble logic, 
            added dynamic simulation physics. Cross-validation accuracy improved from 58.3% to 60.8%. 
            Ensemble model now uses intelligent confidence-weighted combination.
          </p>
        </InfoBox>

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
              <p>The ensemble model combines predictions using a <span className="text-red-400 font-medium">confidence-weighted averaging approach</span> to intelligently leverage the strengths of different methodologies:</p>

              <h4 className="text-lg font-semibold text-red-300">Enhanced Weighting Strategy</h4>
              <MathFormula 
                formula="P_{\text{ensemble}} = w_{ML} \cdot P_{\text{ML}} + w_{sim} \cdot P_{\text{sim}}"
                description="The ensemble uses dynamic confidence-based weighting:"
              />
              
              <p className="text-sm">Where weights are calculated as:</p>
              <MathFormula 
                formula="w_{ML} = \frac{0.6 + confidence_{ML}}{2}, \quad w_{sim} = \frac{0.4 + confidence_{sim}}{2}"
                description="Base weights (60/40) are adjusted by model confidence levels:"
              />
              
              <MathFormula 
                formula="confidence = 2 \cdot |P - 0.5|"
                description="Confidence is determined by distance from neutral (50%):"
              />
              
              <FeatureGrid features={ensembleFeatures} />

              <h4 className="text-lg font-semibold text-red-300">Why This Enhanced Approach?</h4>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li><strong>Confidence-Based:</strong> Models with higher certainty get more weight</li>
                <li><strong>Dynamic Adjustment:</strong> Weights adapt to each specific matchup</li>
                <li><strong>Fixed Logic:</strong> Resolved broken ensemble that performed worse than random</li>
                <li><strong>Intelligent Fallback:</strong> Neutral prediction when both models uncertain</li>
                <li><strong>Improved Performance:</strong> Much more logical and calibrated predictions</li>
              </ul>

              <InfoBox title="Recent Enhancement" icon={<BuildIcon sx={{ fontSize: 16 }} />} variant="success">
                <p>
                  <strong>July 2025 Update:</strong> Implemented confidence-weighted ensemble combination 
                  that intelligently balances ML and simulation predictions based on model certainty, 
                  significantly improving prediction quality and logical consistency.
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
              <p>The ML model uses an <span className="text-red-400 font-medium">Enhanced Random Forest Classifier</span> trained on historical UFC fight data with advanced feature engineering:</p>

              <h4 className="text-lg font-semibold text-red-300">Enhanced Model Architecture</h4>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li><strong>Algorithm:</strong> Random Forest with 200 decision trees</li>
                <li><strong>Max Depth:</strong> 10 levels per tree</li>
                <li><strong>Class Weighting:</strong> Balanced to handle uneven win/loss distributions</li>
                <li><strong>Features:</strong> 41 advanced features (up from 18 basic features)</li>
                <li><strong>Cross-Validation:</strong> 60.8% accuracy (improved from 58.3%)</li>
                <li><strong>Random State:</strong> 42 for reproducible results</li>
              </ul>

              <h4 className="text-lg font-semibold text-red-300">Advanced Feature Set (41 Features)</h4>
              <p className="text-sm">The enhanced model analyzes <strong>41 sophisticated features</strong> including ratios, advantages, and combined scores:</p>
              <FeatureGrid features={mlFeatures} />

              <h4 className="text-lg font-semibold text-red-300">Enhanced Data Processing</h4>
              <MathFormula 
                formula="\text{Ratio}_{\text{feature}} = \frac{\text{Fighter}_A}{\max(\text{Fighter}_B, 0.1)}"
                description="Advanced ratio features capture relative advantages:"
              />
              <MathFormula 
                formula="\text{Combined Score} = \text{Metric}_1 \times \text{Metric}_2 \times \text{Metric}_3"
                description="Combined effectiveness scores integrate multiple related metrics:"
              />
              <p className="text-sm">
                The enhanced model includes <strong>ratio features, physical advantages, and interaction terms</strong> 
                that capture complex relationships between fighter attributes, significantly improving prediction accuracy.
              </p>

              <InfoBox title="July 2025 Enhancement" icon={<BuildIcon sx={{ fontSize: 16 }} />} variant="success">
                <p>
                  <strong>Feature Engineering Overhaul:</strong> Added 23 new advanced features including 
                  performance ratios, physical advantage flags, and combined effectiveness scores, 
                  improving cross-validation accuracy from 58.3% to 60.8%.
                </p>
              </InfoBox>
            </ModelCard>

            <ModelCard
              id="simulation"
              title="Simulation Model"
              description="Uses a biased random walk model to simulate individual rounds and exchanges, providing detailed fight breakdowns."
              icon={<CasinoIcon sx={{ fontSize: 20 }} />}
              isExpanded={expandedModel === 'simulation'}
              onToggle={toggleModel}
            >
              <p>The simulation model uses an <span className="text-red-400 font-medium">enhanced biased random walk</span> approach with dynamic fatigue and momentum modeling:</p>

              <h4 className="text-lg font-semibold text-red-300">1. Enhanced Exchange Probabilities</h4>
              <p className="text-sm">Each exchange accounts for current fighter state:</p>
              <ul className="list-disc ml-6 text-sm">
                <li>Fighter A wins (adjusted by fatigue & momentum)</li>
                <li>Fighter B wins (adjusted by fatigue & momentum)</li>
                <li>Neutral exchange</li>
              </ul>

              <MathFormula 
                formula="P_{A,adj} = P_A \times fatigue_A \times momentum_A"
                description="Probabilities are dynamically adjusted each round:"
              />

              <h4 className="text-lg font-semibold text-red-300">2. Fatigue Modeling</h4>
              <MathFormula 
                formula="fatigue_{factor} = 1.0 - (round \times 0.05)"
                description="Performance decreases 5% per round:"
              />
              <p className="text-sm">
                Simulates realistic performance decline as fighters tire throughout the fight.
              </p>

              <h4 className="text-lg font-semibold text-red-300">3. Momentum System</h4>
              <p className="text-sm">Round performance affects subsequent rounds:</p>
              <ul className="list-disc ml-6 text-sm">
                <li><strong>Strong Round (score {'>'} 2):</strong> +10% momentum boost (max 30%)</li>
                <li><strong>Losing Round (score {'<'} -2):</strong> -5% momentum reduction (min 20%)</li>
                <li><strong>Close Round:</strong> Gradual return to baseline momentum</li>
              </ul>

              <h4 className="text-lg font-semibold text-red-300">4. Probability Normalization</h4>
              <MathFormula 
                formula="P_{total} = P_{A,adj} + P_{B,adj} + P_{neutral}"
                description="Ensures probabilities sum to 1.0:"
              />
              <p className="text-sm">
                If total exceeds 1.0, all probabilities are proportionally scaled down.
              </p>

              <h4 className="text-lg font-semibold text-red-300">5. Striking & Grappling Effectiveness</h4>
              <MathFormula 
                formula="S = \text{SLpM} \cdot \text{Str Acc} \cdot (1 + \text{Opp SD})"
                description="Striking effectiveness includes opponent defense:"
              />
              <MathFormula 
                formula="G = 0.3 \cdot (\text{TD Avg} \cdot \text{TD Acc}) + 0.2 \cdot \text{Sub Avg}"
                description="Grappling combines takedowns and submissions:"
              />
              <MathFormula formula="E_{total} = S + G" />

              <h4 className="text-lg font-semibold text-red-300">6. Round Scoring & Fight Outcome</h4>
              <p className="text-sm">Enhanced scoring with realistic fight progression:</p>
              <ul className="list-disc ml-6 text-sm">
                <li>10 exchanges per round with dynamic probabilities</li>
                <li>Round winner: 10 points, Round loser: 9 points</li>
                <li>Momentum carries between rounds</li>
                <li>Fatigue accumulates throughout fight</li>
              </ul>

              <InfoBox title="July 2025 Enhancement" icon={<BuildIcon sx={{ fontSize: 16 }} />} variant="success">
                <p>
                  <strong>Dynamic Fight Modeling:</strong> Added fatigue modeling (5% per round) and 
                  momentum system (±30% swings) to create more realistic fight progressions and 
                  improve simulation accuracy.
                </p>
              </InfoBox>
            </ModelCard>
          </div>

          <h2 className="text-2xl font-bold mt-8 text-red-400 flex items-center gap-2">
            <WarningAmberIcon sx={{ fontSize: 28 }} />
            Current Limitations & Future Improvements
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Simulation model doesn't account for early stoppages (KOs/submissions)</li>
            <li>No fighting style compatibility analysis (striker vs grappler advantages)</li>
            <li>Recent performance weighting not implemented (all historical data treated equally)</li>
            <li>Fighter database is continuously being updated - not all fighters may be available</li>
            <li>Small training dataset limits ML model potential (more data needed for better accuracy)</li>
            <li>No opponent-specific adjustments (model doesn't learn fighter-specific tendencies)</li>
          </ul>

          <InfoBox title="Recent Improvements (July 2025)" icon={<BuildIcon sx={{ fontSize: 16 }} />} variant="success">
            <p>
              <strong><CheckCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />Enhanced Features:</strong> ML model upgraded from 18 to 41 features<br/>
              <strong><CheckCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />Fixed Ensemble Logic:</strong> Implemented confidence-weighted combination<br/>
              <strong><CheckCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />Dynamic Simulation:</strong> Added fatigue and momentum modeling<br/>
              <strong><CheckCircleIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />Better Accuracy:</strong> Cross-validation improved from 58.3% to 60.8%
            </p>
          </InfoBox>

          <InfoBox title="How to Use Enhanced Models" icon={<LightbulbIcon sx={{ fontSize: 16 }} />} variant="info">
            <p>
              Choose your preferred prediction model on the simulation pages. The <strong>Enhanced Ensemble</strong> model 
              is recommended for most accurate results with confidence-weighted predictions, while the 
              <strong>Enhanced Simulation</strong> model provides detailed exchange probabilities with realistic 
              fatigue and momentum modeling. The <strong>Enhanced ML</strong> model offers sophisticated 
              feature analysis with 41 advanced metrics.
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
