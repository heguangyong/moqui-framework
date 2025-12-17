<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <div class="text-h2 text-weight-bolder text-primary q-mb-md">
        Novel-to-Anime Generator
      </div>
      <div class="text-h5 text-grey-7 q-mb-xl">
        Transform your novels into animated short videos with AI
      </div>
      
      <div class="row q-gutter-md justify-center">
        <q-card class="feature-card" flat bordered>
          <q-card-section>
            <q-icon name="book" size="3rem" color="primary" />
            <div class="text-h6 q-mt-md">Novel Parser</div>
            <div class="text-body2 text-grey-6">
              Upload and analyze novel structure
            </div>
          </q-card-section>
        </q-card>

        <q-card class="feature-card" flat bordered>
          <q-card-section>
            <q-icon name="people" size="3rem" color="secondary" />
            <div class="text-h6 q-mt-md">Character System</div>
            <div class="text-body2 text-grey-6">
              Identify and maintain character consistency
            </div>
          </q-card-section>
        </q-card>

        <q-card class="feature-card" flat bordered>
          <q-card-section>
            <q-icon name="video_library" size="3rem" color="accent" />
            <div class="text-h6 q-mt-md">Episode Generator</div>
            <div class="text-body2 text-grey-6">
              Create episodic content for short videos
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="q-mt-xl">
        <q-btn
          color="primary"
          size="lg"
          label="Get Started"
          to="/novel"
          icon="arrow_forward"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
// Home page component
</script>

<style lang="scss" scoped>
.feature-card {
  width: 200px;
  height: 150px;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-4px);
  }
}
</style>