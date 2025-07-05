import { Link } from "react-router-dom";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden px-4 sm:px-6 py-16">
      {/* Background glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-10 tracking-tight">
          How the Prediction Models Work
        </h1>

        <section className="bg-white/5 border border-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow space-y-6 leading-relaxed text-gray-100 text-base">
          <p>
            The <strong className="text-white">MMA Math simulator</strong> offers three different prediction models to forecast UFC fight outcomes.
            All models use real-world fighter statistics scraped from UFCStats.com to make their predictions.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-red-400">Prediction Models Overview</h2>
          <div className="grid gap-4 mt-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-xl font-semibold text-red-300 mb-2">🎯 Ensemble Model (Default)</h3>
              <p className="text-sm">Combines all available prediction methods for the most accurate results. Uses weighted averages of simulation and machine learning predictions.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-xl font-semibold text-red-300 mb-2">🤖 Machine Learning Model</h3>
              <p className="text-sm">Uses a trained ML model that learns patterns from historical fight data to predict outcomes based on fighter statistics.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-xl font-semibold text-red-300 mb-2">🎲 Simulation Model</h3>
              <p className="text-sm">Uses a biased random walk model to simulate individual rounds and exchanges, providing detailed fight breakdowns.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-8 text-red-400">🎲 Simulation Model Details</h2>
          <p>The simulation model uses a <span className="text-red-400 font-medium">biased random walk</span> approach to model individual fight rounds:</p>

          <h3 className="text-xl font-semibold mt-6 text-red-300">1. Exchange Probabilities</h3>
          <p>Each exchange can result in:</p>
          <ul className="list-disc ml-6">
            <li>Fighter A wins</li>
            <li>Fighter B wins</li>
            <li>Neutral exchange</li>
          </ul>

          <p className="mt-2">These must add to 1:</p>
          <div className="overflow-x-auto">
            <BlockMath math="P_A + P_B + P_{\text{neutral}} = 1" />
          </div>
          <p>
            We assume a fixed <InlineMath math="P_{\text{neutral}} = 0.4" /> to account for randomness.
            The remaining 60% is split based on fighter effectiveness:
          </p>
          <div className="overflow-x-auto">
            <BlockMath math="P_A = 0.6 \cdot \frac{E_A}{E_A + E_B}, \quad P_B = 0.6 \cdot \frac{E_B}{E_A + E_B}" />
          </div>

          <h3 className="text-xl font-semibold mt-6 text-red-300">2. Striking Effectiveness</h3>
          <p>Based on significant strikes, accuracy, and opponent defense:</p>
          <div className="overflow-x-auto">
            <BlockMath math="S = \text{SLpM} \cdot \text{Str Acc} \cdot (1 + \text{Opp SD})" />
          </div>

          <h3 className="text-xl font-semibold mt-6 text-red-300">3. Grappling Effectiveness</h3>
          <p>Grappling considers takedowns and submissions:</p>
          <div className="overflow-x-auto">
            <BlockMath math="T = \text{TD Avg} \cdot \text{TD Acc} \cdot (1 + \text{Opp TDD})" />
            <BlockMath math="G = 0.3 \cdot T + 0.2 \cdot \text{Sub Avg}" />
          </div>

          <h3 className="text-xl font-semibold mt-6 text-red-300">4. Total Effectiveness</h3>
          <div className="overflow-x-auto">
            <BlockMath math="E = S + G" />
          </div>

          <h3 className="text-xl font-semibold mt-6 text-red-300">5. Round and Fight Scoring</h3>
          <p>Each round consists of 10 exchanges. Scoring logic:</p>
          <ul className="list-disc ml-6">
            <li>Round winner: 10 points</li>
            <li>Round loser: 9 points</li>
            <li>Draw: 10–10</li>
          </ul>
          <p className="mt-2">
            The fighter with the most points after 5 rounds wins. Tied score means a draw.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-red-400">🤖 Machine Learning Model</h2>
          <p>The ML model uses a <span className="text-red-400 font-medium">Random Forest Classifier</span> trained on historical UFC fight data with the following configuration:</p>

          <h3 className="text-xl font-semibold mt-6 text-red-300">Model Architecture</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>Algorithm:</strong> Random Forest with 200 decision trees</li>
            <li><strong>Max Depth:</strong> 10 levels per tree</li>
            <li><strong>Class Weighting:</strong> Balanced to handle uneven win/loss distributions</li>
            <li><strong>Random State:</strong> 42 for reproducible results</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 text-red-300">Feature Set</h3>
          <p>The model analyzes <strong>26 key features</strong> for each fighter matchup:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-red-300 mb-2">🥊 Striking Metrics</h4>
              <ul className="text-sm space-y-1">
                <li>• Strikes Landed per Minute (SLpM)</li>
                <li>• Striking Accuracy (%)</li>
                <li>• Striking Defense (%)</li>
                <li>• Significant Strike Differential</li>
              </ul>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-red-300 mb-2">🤼 Grappling Metrics</h4>
              <ul className="text-sm space-y-1">
                <li>• Takedown Average per 15 min</li>
                <li>• Takedown Accuracy (%)</li>
                <li>• Takedown Defense (%)</li>
                <li>• Submission Attempts per 15 min</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-red-300 mb-2">📏 Physical Attributes</h4>
              <ul className="text-sm space-y-1">
                <li>• Height (inches)</li>
                <li>• Weight (pounds)</li>
                <li>• Reach (inches)</li>
                <li>• Age (years)</li>
              </ul>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-red-300 mb-2">🏆 Performance History</h4>
              <ul className="text-sm space-y-1">
                <li>• Win/Loss Record</li>
                <li>• Recent Form</li>
                <li>• Opponent Quality</li>
                <li>• Fight Outcome Patterns</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-6 text-red-300">Data Processing</h3>
          <p>Each fighter's data is processed through comparative analysis:</p>
          <div className="overflow-x-auto mt-2">
            <BlockMath math="\text{Feature}_{\text{diff}} = \text{Fighter}_A - \text{Fighter}_B" />
          </div>
          <p className="mt-2">
            The model learns from <strong>differential patterns</strong> rather than absolute values, 
            making it more effective at identifying advantages between fighters.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-red-400">🎯 Ensemble Model</h2>
          <p>The ensemble model combines predictions using a <span className="text-red-400 font-medium">weighted averaging approach</span> to leverage the strengths of different methodologies:</p>

          <h3 className="text-xl font-semibold mt-6 text-red-300">Weighting Strategy</h3>
          <p>The ensemble uses the following weight distribution:</p>
          <div className="overflow-x-auto mt-2">
            <BlockMath math="P_{\text{ensemble}} = 0.6 \cdot P_{\text{ML}} + 0.4 \cdot P_{\text{sim}}" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-red-300 mb-2">🤖 Machine Learning (60%)</h4>
              <ul className="text-sm space-y-1">
                <li>• Higher weight due to historical data learning</li>
                <li>• Captures complex non-linear patterns</li>
                <li>• Adapts to fighter-specific tendencies</li>
                <li>• Better at identifying statistical advantages</li>
              </ul>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h4 className="text-lg font-semibold text-red-300 mb-2">🎲 Simulation (40%)</h4>
              <ul className="text-sm space-y-1">
                <li>• Provides fight-by-fight variability</li>
                <li>• Models round-by-round dynamics</li>
                <li>• Accounts for probabilistic outcomes</li>
                <li>• Offers interpretable exchange probabilities</li>
              </ul>
            </div>
          </div>

          <h3 className="text-xl font-semibold mt-6 text-red-300">Ensemble Logic</h3>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600 mt-4">
            <pre className="text-sm text-gray-300">
{`1. Run ML model → Get P_ML
2. Run Simulation → Get P_sim  
3. Calculate weighted average:
   P_final = 0.6 × P_ML + 0.4 × P_sim
4. Return consensus prediction`}
            </pre>
          </div>

          <h3 className="text-xl font-semibold mt-6 text-red-300">Why This Weighting?</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li><strong>ML Dominance (60%):</strong> Historical data patterns are strong predictors</li>
            <li><strong>Simulation Balance (40%):</strong> Adds realistic fight variability</li>
            <li><strong>Consensus Approach:</strong> Reduces individual model weaknesses</li>
            <li><strong>Empirical Testing:</strong> 60/40 split showed best validation accuracy</li>
          </ul>

          <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg mt-4">
            <h4 className="text-lg font-semibold text-yellow-300 mb-2">🔧 Adaptive Weighting (Future Enhancement)</h4>
            <p className="text-sm">
              Future versions will implement <strong>confidence-based weighting</strong> where model weights 
              adjust based on data quality and prediction confidence for each specific fighter matchup.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-8 text-red-400">⚠️ Current Limitations</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>Simulation model doesn't account for early stoppages (KOs/submissions)</li>
            <li>No momentum or fatigue modeling between rounds</li>
            <li>Judging criteria like damage or aggression not fully considered</li>
            <li>Fighter database is continuously being updated - not all fighters may be available</li>
            <li>Models are based on historical data and may not reflect recent performance changes</li>
          </ul>

          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mt-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">💡 How to Use</h3>
            <p className="text-sm">
              Choose your preferred prediction model on the simulation pages. The <strong>Ensemble</strong> model 
              is recommended for most accurate results, while the <strong>Simulation</strong> model provides 
              detailed exchange probabilities and round-by-round breakdowns.
            </p>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/simulate"
              className="text-red-400 hover:underline font-medium text-base mr-6"
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
        </section>
      </div>
    </div>
  );
}
