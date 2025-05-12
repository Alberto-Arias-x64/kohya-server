import { paths } from '../config/config.js';
import { spawn } from 'child_process';
import { Logger } from './Logger.js';
import { join } from 'path';

const logger = Logger.getInstance();

export const TaskStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export const QueueStatus = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  STOPPED: 'STOPPED'
};

export class KohyaQueue {
  static instance = new KohyaQueue();
  #status = QueueStatus.IDLE;
  #log = '';

  constructor() {
    this.queue = [];
    this.interval = setInterval(this.#checkQueue, 1000);
  }

  static getInstance() {
    if (!KohyaQueue.instance) KohyaQueue.instance = new KohyaQueue();
    return KohyaQueue.instance;
  }

  get getStatus() {
    return {
      status: this.#status,
      queue: this.queue.length || 0,
      currentTask: this.queue.at(-1)?.id || null
    };
  }

  getTaskInfo(id) {
    const task = this.queue.reverse().find(task => task.id === id);
    const position = this.queue.reverse().findIndex(task => task.id === id);
    if (!task) return null;
    return {
      status: task.status,
      position: position,
      log: this.#log
    };
  }

  setTask(id) {
    this.queue.unshift({
      id,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.#checkQueue();
  }

  async #checkQueue() {
    if (!this.queue) return;
    if (this.queue.length === 0) {
      this.#status = QueueStatus.IDLE;
      return;
    }

    const task = this.queue.at(-1);
    if (task.status === TaskStatus.PROCESSING) return;
    if (task.status === TaskStatus.COMPLETED) {
      logger.info(`Task ${task.id} completed`, { task });
      this.queue.pop();
      return;
    }
    if (task.status === TaskStatus.FAILED) {
      logger.error(`Task ${task.id} failed`, { task });
      this.queue.pop();
      return;
    }
    logger.info(`Task ${task.id} started`, { task });
    task.status = TaskStatus.PROCESSING;
    this.#status = QueueStatus.RUNNING;
    task.updatedAt = new Date();
    this.#processTask(task);
  }

  async #processTask(task) {
    const { id } = task;
    const path = join(paths.datasetsPath, id);
    const command = '/home/flux/kohya_ss/.venv/bin/accelerate';
    const args = [
      'launch',
      '--dynamo_backend', 'no',
      '--dynamo_mode', 'default',
      '--mixed_precision', 'bf16',
      '--num_processes', '1',
      '--num_machines', '1',
      '--num_cpu_threads_per_process', '2',
      '/home/flux/kohya_ss/sd-scripts/flux_train_network.py',
      '--config_file',
      join(path, 'config.toml')
    ];

    const kohya = spawn(command, args);

    kohya.stderr.on('data', (data) => {
      this.#log = data.toString().split('\n').at(-1);
    });

    kohya.on('error', (error) => {
      logger.error(`Task ${id} failed`, { error: error.message, stack: error.stack });
      task.status = TaskStatus.FAILED;
      task.updatedAt = new Date();
      this.#log = error.message;
    });

    kohya.on('close', (code) => {
      logger.info(`Task ${id} closed with code ${code}`);
      task.status = TaskStatus.COMPLETED;
      task.updatedAt = new Date();
      this.#log = 'Completed task';
    });
  }
} 