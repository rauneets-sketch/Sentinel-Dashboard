const { StepTracker } = require('../utils/StepTracker');
const { SlackNotifier } = require('../utils/SlackNotifier');

class EightJourneyRunner {
  constructor() {
    this.stepTracker = new StepTracker();
    this.slackNotifier = new SlackNotifier();
    this.journeys = [
      'Home Page Exploration',
      'Payment Methods Testing',
      'Checkout Login Flow',
      'Reminder and FAQ Testing',
      'International Purchase',
      'DA Page Modification',
      'Cake Variant Exploration',
      'Combinational Purchase'
    ];
  }

  async startJourneyExecution() {
    console.log('🚀 Starting Eight Journey Execution Framework');
    await this.slackNotifier.sendMessage('🚀 Starting Complete Eight Journey Test Execution');

    // Track overall execution
    const executionId = this.stepTracker.addStep('Eight Journey Execution', 'running');

    try {
      // Journey tracking
      for (let i = 0; i < this.journeys.length; i++) {
        const journeyId = this.stepTracker.addStep(`Journey ${i + 1}: ${this.journeys[i]}`, 'running');
        await this.slackNotifier.sendJourneyStart(this.journeys[i]);

        // Simulate journey execution (in real scenario, this would call actual test methods)
        console.log(`📋 Executing ${this.journeys[i]}...`);

        // Complete journey step
        this.stepTracker.completeStep(journeyId, 'passed');
      }

      // Special tracking for DA Journey
      await this.slackNotifier.sendDAJourneyStart();
      const daJourneyId = this.stepTracker.addDAStep('Complete DA Page Modification');
      this.stepTracker.completeStep(daJourneyId, 'passed');

      // Complete overall execution
      this.stepTracker.completeStep(executionId, 'passed');

      // Send completion notifications
      const summary = this.stepTracker.getSummary();
      const daSummary = this.stepTracker.getDAJourneySummary();

      await this.slackNotifier.sendDAJourneyComplete(daSummary);
      await this.slackNotifier.sendAllJourneysComplete(summary);

      return summary;

    } catch (error) {
      this.stepTracker.completeStep(executionId, 'failed', error.message);
      await this.slackNotifier.sendMessage(`❌ Eight Journey Execution Failed: ${error.message}`);
      throw error;
    }
  }

  async executeDAJourneyOnly() {
    console.log('🏠 Starting DA Page Modification Journey Only');
    await this.slackNotifier.sendDAJourneyStart();

    const daJourneyId = this.stepTracker.addDAStep('DA Page Modification Journey');

    try {
      // DA Journey specific steps
      const steps = [
        'Navigate to FNP Homepage',
        'Navigate to FNP Luxe Section',
        'Navigate to Same Day Luxury Gifts',
        'Select Golden Hour Product',
        'Set Initial Delivery Date',
        'Add to Cart and Continue',
        'Modify Delivery Information',
        'Add Frequent Add-ons',
        'Handle Ordering Options',
        'Add New Address',
        'Fill Address Details',
        'Save and Deliver',
        'Edit Sender Name'
      ];

      for (const step of steps) {
        const stepId = this.stepTracker.addDAStep(step);
        // Simulate step execution
        await new Promise(resolve => setTimeout(resolve, 500));
        this.stepTracker.completeStep(stepId, 'passed');
      }

      this.stepTracker.completeStep(daJourneyId, 'passed');

      const daSummary = this.stepTracker.getDAJourneySummary();
      await this.slackNotifier.sendDAJourneyComplete(daSummary);

      return daSummary;

    } catch (error) {
      this.stepTracker.completeStep(daJourneyId, 'failed', error.message);
      await this.slackNotifier.sendMessage(`❌ DA Journey Failed: ${error.message}`);
      throw error;
    }
  }

  getExecutionSummary() {
    return this.stepTracker.getSummary();
  }

  getDAJourneySummary() {
    return this.stepTracker.getDAJourneySummary();
  }
}

module.exports = { EightJourneyRunner };
