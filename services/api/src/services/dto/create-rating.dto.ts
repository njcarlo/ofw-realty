export class CreateRatingDto {
  /** Integer score between 1 and 5 (inclusive) */
  score!: number
  review?: string
}
