import { IsEnum } from 'class-validator';

export class ConvertCaptureDto {
  @IsEnum(['task', 'planner_event', 'habit', 'goal', 'money_note'])
  targetType!: 'task' | 'planner_event' | 'habit' | 'goal' | 'money_note';
}
